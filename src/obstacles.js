const MIN_LEVEL_FOR_OBSTACLES = 3;
const OBSTACLES_PER_LEVEL = 2;
const MAX_OBSTACLES = 12;

export class Obstacles {
  constructor(gridWidth, gridHeight) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    /** @type {Array<{x: number, y: number}>} */
    this.cells = [];
  }

  /**
   * Generate obstacle positions for the given level.
   * Level 1-2: no obstacles.
   * Level 3+: min(2*(level-2), 12) obstacles placed on free cells.
   * @param {number} level
   * @param {Array<{x: number, y: number}>} excludedCells - cells to avoid (snake body + food)
   */
  generate(level, excludedCells = []) {
    if (level < MIN_LEVEL_FOR_OBSTACLES) {
      this.cells = [];
      return;
    }

    const count = Math.min(OBSTACLES_PER_LEVEL * (level - 2), MAX_OBSTACLES);
    const occupied = new Set(excludedCells.map((c) => `${c.x},${c.y}`));

    const freeCells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
      }
    }

    this.cells = [];
    for (let i = 0; i < count && freeCells.length > 0; i++) {
      const idx = Math.floor(Math.random() * freeCells.length);
      this.cells.push(freeCells[idx]);
      freeCells.splice(idx, 1);
    }
  }

  /**
   * Returns true if the given grid cell contains an obstacle.
   * @param {number} x
   * @param {number} y
   */
  checkCollision(x, y) {
    return this.cells.some((ob) => ob.x === x && ob.y === y);
  }

  /** Returns the obstacle positions array, for use in food spawn exclusions. */
  getPositions() {
    return this.cells;
  }
}
