export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number} cellSize - pixel size of one grid cell
   */
  constructor(canvas, cellSize) {
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.cellSize = cellSize;
  }

  /** Wipe the entire canvas. */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /** Draw faint grid lines so the player can gauge distances. */
  drawGrid() {
    const { ctx, width, height, cellSize } = this;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;

    for (let x = cellSize; x < width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = cellSize; y < height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  /**
   * Draw the snake with a distinguished head and gradient body.
   * @param {Array<{x: number, y: number}>} body
   */
  drawSnake(body) {
    const { ctx, cellSize } = this;
    const pad = 1; // slight padding between segments

    body.forEach((seg, index) => {
      const px = seg.x * cellSize + pad;
      const py = seg.y * cellSize + pad;
      const size = cellSize - pad * 2;
      const radius = index === 0 ? 6 : 4;

      if (index === 0) {
        ctx.fillStyle = '#00e676';
      } else {
        // Fade from bright green to a darker teal along the body
        const t = index / Math.max(body.length - 1, 1);
        const r = Math.round(0 + t * 0);
        const g = Math.round(200 - t * 100);
        const b = Math.round(100 + t * 60);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      }

      this._roundRect(px, py, size, size, radius);
      ctx.fill();
    });

    // Draw eyes on the head (pass full body to infer direction)
    this._drawEyes(body[0], body);
  }

  /**
   * Draw two small eyes on the head segment, positioned according to
   * the snake's facing direction (inferred from head vs second segment).
   * @param {{x: number, y: number}} head
   * @param {Array<{x: number, y: number}>} body
   */
  _drawEyes(head, body) {
    const { ctx, cellSize } = this;
    const cx = head.x * cellSize + cellSize / 2;
    const cy = head.y * cellSize + cellSize / 2;
    const eyeRadius = 2.5;
    const fwd = 4;  // forward offset from centre
    const perp = 4; // perpendicular offset (spacing between eyes)

    // Determine heading from head -> neck difference; default right
    let dx = 1;
    let dy = 0;
    if (body.length > 1) {
      dx = head.x - body[1].x;
      dy = head.y - body[1].y;
    }

    // Forward unit + perpendicular unit
    const positions = [
      { x: cx + dx * fwd - dy * perp, y: cy + dy * fwd + dx * perp },
      { x: cx + dx * fwd + dy * perp, y: cy + dy * fwd - dx * perp },
    ];

    ctx.fillStyle = '#1a1a2e';
    positions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Draw the food as a glowing red circle.
   * @param {{x: number, y: number}} position
   */
  drawFood(position) {
    const { ctx, cellSize } = this;
    const cx = position.x * cellSize + cellSize / 2;
    const cy = position.y * cellSize + cellSize / 2;
    const radius = cellSize / 2 - 2;

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.6);
    glow.addColorStop(0, 'rgba(255, 82, 82, 0.3)');
    glow.addColorStop(1, 'rgba(255, 82, 82, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(
      position.x * cellSize - cellSize * 0.3,
      position.y * cellSize - cellSize * 0.3,
      cellSize * 1.6,
      cellSize * 1.6
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
   * Utility: draw a rounded rectangle and add it to the current path.
   * Does NOT call fill/stroke -- caller is responsible.
   */
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
