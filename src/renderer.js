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
   */
  drawSnake(body) {
    const { ctx, cellSize } = this;
    const pad = 1;

    body.forEach((seg, index) => {
      const px = seg.x * cellSize + pad;
      const py = seg.y * cellSize + pad;
      const size = cellSize - pad * 2;
      const radius = index === 0 ? 6 : 4;

      if (index === 0) {
        ctx.fillStyle = '#00e676';
      } else {
        const t = index / Math.max(body.length - 1, 1);
        ctx.fillStyle = `rgb(0, ${Math.round(200 - t * 100)}, ${Math.round(100 + t * 60)})`;
      }

      this._roundRect(px, py, size, size, radius);
      ctx.fill();
    });

    this._drawEyes(body[0], body);
  }

  /**
   * Draw two eyes on the head segment, direction-aware.
   * @param {{x: number, y: number}} head
   * @param {Array<{x: number, y: number}>} body
   */
  _drawEyes(head, body) {
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

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx + dx * fwd - dy * perp, cy + dy * fwd + dx * perp, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + dx * fwd + dy * perp, cy + dy * fwd - dx * perp, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw food with a sine-wave breathing pulse.
   * @param {{x: number, y: number}} position
   * @param {number} [timestamp=0] - rAF timestamp for animation
   */
  drawFood(position, timestamp = 0) {
    if (position.x < 0) return; // sentinel value when grid is full
    const { ctx, cellSize } = this;
    const cx = position.x * cellSize + cellSize / 2;
    const cy = position.y * cellSize + cellSize / 2;
    const pulse = 1 + Math.sin(timestamp * 0.004) * 0.1;
    const radius = (cellSize / 2 - 2) * pulse;

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.8);
    glow.addColorStop(0, 'rgba(255, 82, 82, 0.35)');
    glow.addColorStop(1, 'rgba(255, 82, 82, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(
      position.x * cellSize - cellSize * 0.4,
      position.y * cellSize - cellSize * 0.4,
      cellSize * 1.8,
      cellSize * 1.8
    );

    // Food body
    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, radius);
    grad.addColorStop(0, '#ff8a80');
    grad.addColorStop(1, '#ff1744');
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
   * Each effect: { type, x, y, startTime, duration }
   * @param {Array} effects
   * @param {number} currentTime
   */
  drawEffects(effects, currentTime) {
    effects.forEach((fx) => {
      const progress = Math.min((currentTime - fx.startTime) / fx.duration, 1);
      if (fx.type === 'foodEaten') {
        this._drawFoodEatenEffect(fx, progress);
      } else if (fx.type === 'scorePopup') {
        this._drawScorePopup(fx, progress);
      }
    });
  }

  /**
   * Expanding ring effect when food is eaten.
   * @param {{x: number, y: number}} fx
   * @param {number} progress 0→1
   */
  _drawFoodEatenEffect(fx, progress) {
    const { ctx, cellSize } = this;
    const cx = fx.x * cellSize + cellSize / 2;
    const cy = fx.y * cellSize + cellSize / 2;
    const alpha = 1 - progress;

    for (let i = 0; i < 2; i++) {
      const r = cellSize * (0.4 + progress * 0.9 + i * 0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 230, 118, ${alpha * (0.9 - i * 0.4)})`;
      ctx.lineWidth = 2 - i * 0.5;
      ctx.stroke();
    }
  }

  /**
   * Floating "+10" score text that drifts up and fades.
   * @param {{x: number, y: number}} fx
   * @param {number} progress 0→1
   */
  _drawScorePopup(fx, progress) {
    const { ctx, cellSize } = this;
    const x = fx.x * cellSize + cellSize / 2;
    const y = fx.y * cellSize - progress * cellSize * 1.8;
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

    ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
    ctx.font = `bold 15px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('+10', x, y);
    ctx.textAlign = 'left';
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
