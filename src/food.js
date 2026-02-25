export class Food {
  /**
   * @param {number} gridWidth  - number of columns
   * @param {number} gridHeight - number of rows
   */
  constructor(gridWidth, gridHeight) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.position = { x: 0, y: 0 };
    /** @type {'normal'|'golden'|'blue'} */
    this.type = 'normal';
    /** Timestamp (rAF ms) when this food expires. null = never. Set by game.js. */
    this.expireAt = null;
    /** Timestamp when this food was spawned. Set by game.js. */
    this.spawnedAt = 0;
  }

  /**
   * Place food at a random unoccupied cell and pick a random type.
   * Uses free-cell enumeration to guarantee uniform distribution and termination.
   * @param {Array<{x: number, y: number}>} snakeBody
   */
  spawn(snakeBody, obstacles = []) {
    const occupied = new Set(snakeBody.map((seg) => `${seg.x},${seg.y}`));
    obstacles.forEach((ob) => occupied.add(`${ob.x},${ob.y}`));

    const freeCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
      }
    }

    if (freeCells.length === 0) {
      this.position = { x: -1, y: -1 };
      this.type = 'normal';
      return;
    }

    const idx = Math.floor(Math.random() * freeCells.length);
    this.position = freeCells[idx];
    this.type = this._pickType();
    // expireAt and spawnedAt are stamped by game.js after spawn()
    this.expireAt = null;
    this.spawnedAt = 0;
  }

  /**
   * Randomly select food type.
   *   15% → golden (+50 pts, no growth, expires in 8s)
   *   15% → blue   (+20 pts, grows, 3s speed debuff)
   *   70% → normal (+10 pts, grows)
   */
  _pickType() {
    const r = Math.random();
    if (r < 0.15) return 'golden';
    if (r < 0.30) return 'blue';
    return 'normal';
  }
}
