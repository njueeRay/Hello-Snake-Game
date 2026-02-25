const SNAKE_SKINS = {
  classic: {
    headColor: '#00e676',
    bodyFrom: { r: 0,   g: 200, b: 100 },
    bodyTo:   { r: 0,   g: 100, b: 160 },
    eyeColor: '#1a1a2e',
  },
  cyber: {
    headColor: '#00e5ff',
    bodyFrom: { r: 0,   g: 229, b: 255 },
    bodyTo:   { r: 0,   g: 91,  b: 187 },
    eyeColor: '#ffffff',
  },
  neon: {
    headColor: '#e040fb',
    bodyFrom: { r: 224, g: 64,  b: 251 },
    bodyTo:   { r: 170, g: 0,   b: 255 },
    eyeColor: '#ffffff',
  },
  golden: {
    headColor: '#ffd740',
    bodyFrom: { r: 255, g: 215, b: 64  },
    bodyTo:   { r: 255, g: 143, b: 0   },
    eyeColor: '#1a1a2e',
  },
};

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number} cellSize - logical pixel size of one grid cell
   */
  constructor(canvas, cellSize) {
    this.cellSize = cellSize;

    // HiDPI: scale canvas internal resolution, keep CSS size unchanged
    const dpr = window.devicePixelRatio || 1;
    this.logicalWidth = canvas.width;
    this.logicalHeight = canvas.height;
    canvas.width = this.logicalWidth * dpr;
    canvas.height = this.logicalHeight * dpr;
    canvas.style.width = `${this.logicalWidth}px`;
    canvas.style.height = `${this.logicalHeight}px`;

    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
  }

  /** Wipe the entire canvas. */
  clear() {
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  /**
   * Draw faint grid lines. Brightness increases subtly with score.
   * @param {number} [score=0]
   */
  drawGrid(score = 0) {
    const { ctx, logicalWidth, logicalHeight, cellSize } = this;
    const intensity = Math.min(0.03 + score * 0.00008, 0.10);
    ctx.strokeStyle = `rgba(0, 230, 118, ${intensity})`;
    ctx.lineWidth = 0.5;

    for (let x = cellSize; x < logicalWidth; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalHeight);
      ctx.stroke();
    }
    for (let y = cellSize; y < logicalHeight; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalWidth, y);
      ctx.stroke();
    }
  }

  /**
   * Draw the snake with a distinguished head and gradient body.
   * @param {Array<{x: number, y: number}>} body
   * @param {string} [skinKey='classic']
   */
  drawSnake(body, skinKey = 'classic') {
    if (!body || body.length === 0) return;
    const skin = SNAKE_SKINS[skinKey] || SNAKE_SKINS.classic;
    const { ctx, cellSize } = this;
    const pad = 1;
    body.forEach((seg, index) => {
      const px = seg.x * cellSize + pad;
      const py = seg.y * cellSize + pad;
      const size = cellSize - pad * 2;
      const radius = index === 0 ? 6 : 4;
      if (index === 0) {
        ctx.fillStyle = skin.headColor;
      } else {
        const t = index / Math.max(body.length - 1, 1);
        const { r: r1, g: g1, b: b1 } = skin.bodyFrom;
        const { r: r2, g: g2, b: b2 } = skin.bodyTo;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      }
      this._roundRect(px, py, size, size, radius);
      ctx.fill();
    });
    this._drawEyes(body[0], body, skin.eyeColor);
  }

  /**
   * Draw two eyes on the head segment, direction-aware.
   * @param {{x: number, y: number}} head
   * @param {Array<{x: number, y: number}>} body
   * @param {string} [eyeColor='#1a1a2e']
   */
  _drawEyes(head, body, eyeColor = '#1a1a2e') {
    const { ctx, cellSize } = this;
    const cx = head.x * cellSize + cellSize / 2;
    const cy = head.y * cellSize + cellSize / 2;
    const eyeRadius = 2.5;
    const fwd = 4;
    const perp = 4;

    let dx = 1;
    let dy = 0;
    if (body.length > 1) {
      dx = head.x - body[1].x;
      dy = head.y - body[1].y;
    }

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(cx + dx * fwd - dy * perp, cy + dy * fwd + dx * perp, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + dx * fwd + dy * perp, cy + dy * fwd - dx * perp, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw obstacle cells as dark brick tiles.
   * @param {Array<{x: number, y: number}>} obstacles
   */
  drawObstacles(obstacles) {
    if (!obstacles || obstacles.length === 0) return;
    const { ctx } = this;
    const pad = 1;

    obstacles.forEach((ob) => {
      const px = ob.x * this.cellSize + pad;
      const py = ob.y * this.cellSize + pad;
      const size = this.cellSize - pad * 2;

      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(px, py, size, size);

      ctx.strokeStyle = '#555566';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, size, size);

      // Horizontal mid-line texture
      ctx.strokeStyle = '#2a2a3a';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, py + size / 2);
      ctx.lineTo(px + size, py + size / 2);
      ctx.stroke();
    });
  }

  /**
   * Dispatch food rendering to the correct type-specific method.
   * @param {import('./food.js').Food} food
   * @param {number} [timestamp=0]
   */
  drawFood(food, timestamp = 0) {
    if (food.position.x < 0) return;

    // Flashing when < 2 s remain for timed food
    if (food.expireAt !== null) {
      const remaining = food.expireAt - timestamp;
      if (remaining < 2000 && Math.floor(timestamp / 200) % 2 === 1) return;
    }

    switch (food.type) {
      case 'golden': this._drawGoldenFood(food.position, timestamp); break;
      case 'blue':   this._drawBlueFood(food.position, timestamp);   break;
      default:       this._drawNormalFood(food.position, timestamp);  break;
    }
  }

  /**
   * Normal red food with breathing pulse.
   * @param {{x: number, y: number}} pos
   * @param {number} timestamp
   */
  _drawNormalFood(pos, timestamp) {
    const { ctx, cellSize } = this;
    const cx = pos.x * cellSize + cellSize / 2;
    const cy = pos.y * cellSize + cellSize / 2;
    const pulse = 1 + Math.sin(timestamp * 0.004) * 0.1;
    const radius = (cellSize / 2 - 2) * pulse;

    const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.8);
    glow.addColorStop(0, 'rgba(255, 82, 82, 0.35)');
    glow.addColorStop(1, 'rgba(255, 82, 82, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(pos.x * cellSize - cellSize * 0.4, pos.y * cellSize - cellSize * 0.4, cellSize * 1.8, cellSize * 1.8);

    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, radius);
    grad.addColorStop(0, '#ff8a80');
    grad.addColorStop(1, '#ff1744');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Golden food: +50 pts, no growth. Gold circle with star-burst glow.
   * @param {{x: number, y: number}} pos
   * @param {number} timestamp
   */
  _drawGoldenFood(pos, timestamp) {
    const { ctx, cellSize } = this;
    const cx = pos.x * cellSize + cellSize / 2;
    const cy = pos.y * cellSize + cellSize / 2;
    // Slightly faster, more dramatic pulse
    const pulse = 1 + Math.sin(timestamp * 0.005) * 0.15;
    const radius = (cellSize / 2 - 1) * pulse;

    // Outer star-burst glow
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.2);
    glow.addColorStop(0, 'rgba(255, 215, 64, 0.5)');
    glow.addColorStop(0.5, 'rgba(255, 180, 0, 0.2)');
    glow.addColorStop(1, 'rgba(255, 215, 64, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(pos.x * cellSize - cellSize * 0.6, pos.y * cellSize - cellSize * 0.6, cellSize * 2.2, cellSize * 2.2);

    // Gold body
    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, radius);
    grad.addColorStop(0, '#fff176');
    grad.addColorStop(0.5, '#ffd740');
    grad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Star highlight ring
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Blue food: +20 pts, speed debuff. Cyan circle with slower pulse.
   * @param {{x: number, y: number}} pos
   * @param {number} timestamp
   */
  _drawBlueFood(pos, timestamp) {
    const { ctx, cellSize } = this;
    const cx = pos.x * cellSize + cellSize / 2;
    const cy = pos.y * cellSize + cellSize / 2;
    // Slower, calmer pulse
    const pulse = 1 + Math.sin(timestamp * 0.002) * 0.08;
    const radius = (cellSize / 2 - 2) * pulse;

    // Cyan glow
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 2.0);
    glow.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(pos.x * cellSize - cellSize * 0.5, pos.y * cellSize - cellSize * 0.5, cellSize * 2.0, cellSize * 2.0);

    // Blue body
    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, radius);
    grad.addColorStop(0, '#80d8ff');
    grad.addColorStop(1, '#0091ea');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw a one-shot red flash at the death position (before game-over overlay).
   * @param {{x: number, y: number}} headPos
   */
  drawDeathFlash(headPos) {
    const { ctx, cellSize } = this;
    const cx = headPos.x * cellSize + cellSize / 2;
    const cy = headPos.y * cellSize + cellSize / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 3);
    grad.addColorStop(0, 'rgba(255, 82, 82, 0.7)');
    grad.addColorStop(1, 'rgba(255, 82, 82, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, cellSize * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render all active particle/popup effects.
   * Each effect: { type, foodType, value, x, y, startTime, duration }
   * @param {Array} effects
   * @param {number} currentTime
   */
  drawEffects(effects, currentTime) {
    const { ctx } = this;
    effects.forEach((fx) => {
      const progress = Math.min((currentTime - fx.startTime) / fx.duration, 1);
      if (fx.type === 'foodEaten') {
        this._drawFoodEatenEffect(fx, progress);
      } else if (fx.type === 'scorePopup') {
        this._drawScorePopup(fx, progress);
      } else if (fx.type === 'debuffActive') {
        this._drawDebuffIndicator(fx, progress);
      } else if (fx.type === 'comboFlash') {
        const alpha = 1 - progress;
        const scale = 1 + progress * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.font = `bold ${Math.round(28 * scale)}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = '#ffd740';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = (this.logicalWidth / 2);
        const centerY = (this.logicalHeight / 2) - 40 * progress;
        ctx.fillText(`×${fx.mult}`, centerX, centerY);
        ctx.restore();
      }
    });
  }

  /**
   * Expanding ring effect when food is eaten. Color tinted by food type.
   * @param {object} fx
   * @param {number} progress 0→1
   */
  _drawFoodEatenEffect(fx, progress) {
    const { ctx, cellSize } = this;
    const cx = fx.x * cellSize + cellSize / 2;
    const cy = fx.y * cellSize + cellSize / 2;
    const alpha = 1 - progress;

    const color = fx.foodType === 'golden'
      ? `255, 215, 64`
      : fx.foodType === 'blue'
        ? `0, 229, 255`
        : `0, 230, 118`;

    for (let i = 0; i < 2; i++) {
      const r = cellSize * (0.4 + progress * 0.9 + i * 0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${alpha * (0.9 - i * 0.4)})`;
      ctx.lineWidth = 2 - i * 0.5;
      ctx.stroke();
    }
  }

  /**
   * Floating score text that drifts up and fades. Value and color per food type.
   * @param {object} fx
   * @param {number} progress 0→1
   */
  _drawScorePopup(fx, progress) {
    const { ctx, cellSize } = this;
    const x = fx.x * cellSize + cellSize / 2;
    const y = fx.y * cellSize - progress * cellSize * 1.8;
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
    const value = fx.value || 10;

    if (fx.foodType === 'golden') {
      ctx.fillStyle = `rgba(255, 215, 64, ${alpha})`;
      ctx.font = `bold 18px monospace`;
    } else if (fx.foodType === 'blue') {
      ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.font = `bold 14px monospace`;
    } else {
      ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
      ctx.font = `bold 15px monospace`;
    }

    ctx.textAlign = 'center';
    ctx.fillText(`+${value}`, x, y);
    ctx.textAlign = 'left';
  }

  /**
   * Brief blue flash on the snake head when speed debuff activates.
   * @param {object} fx
   * @param {number} progress 0→1
   */
  _drawDebuffIndicator(fx, progress) {
    const { ctx, cellSize } = this;
    const cx = fx.x * cellSize + cellSize / 2;
    const cy = fx.y * cellSize + cellSize / 2;
    const alpha = (1 - progress) * 0.45;
    const r = cellSize * (0.8 + progress * 0.6);
    ctx.fillStyle = `rgba(0, 145, 234, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** @private */
  _roundRect(x, y, w, h, r) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export { SNAKE_SKINS };
