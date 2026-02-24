export class Food {
  /**
   * @param {number} gridWidth  - number of columns
   * @param {number} gridHeight - number of rows
   */
  constructor(gridWidth, gridHeight) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.position = { x: 0, y: 0 };
  }

  /**
   * Place the food at a random grid cell that does not overlap the snake.
   *
   * Strategy: build a set of occupied cells, then pick from the remaining
   * free cells uniformly at random. This avoids the "retry loop" problem
   * when the snake is very long and most cells are occupied.
   *
   * @param {Array<{x: number, y: number}>} snakeBody
   */
  spawn(snakeBody) {
    const occupied = new Set(
      snakeBody.map((seg) => `${seg.x},${seg.y}`)
    );

    const freeCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) {
          freeCells.push({ x, y });
        }
      }
    }

    // If somehow zero free cells remain the game is essentially won
    if (freeCells.length === 0) {
      this.position = { x: -1, y: -1 };
      return;
    }

    const idx = Math.floor(Math.random() * freeCells.length);
    this.position = freeCells[idx];
  }
}
