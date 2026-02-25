const MIN_LEVEL_FOR_OBSTACLES = 3;
const OBSTACLES_PER_LEVEL = 2;
const MAX_OBSTACLES = 12;
const MAX_PATTERN_ATTEMPTS = 50;

const PATTERNS = {
  cross: [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
  ],
  lshape: [
    { dx: 0, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: 2 },
    { dx: 1, dy: 0 }, { dx: 2, dy: 0 },
  ],
  line_h: [
    { dx: -2, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 },
    { dx: 1, dy: 0 }, { dx: 2, dy: 0 },
  ],
  line_v: [
    { dx: 0, dy: -2 }, { dx: 0, dy: -1 }, { dx: 0, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: 2 },
  ],
  square: [
    { dx: 0, dy: 0 }, { dx: 1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 1, dy: 1 },
  ],
  dot_trio: [
    { dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 },
  ],
};

const PATTERN_KEYS = Object.keys(PATTERNS);

export class Obstacles {
  constructor(gridWidth, gridHeight) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.cells = [];
  }

  /**
   * Generate obstacle positions using structured patterns.
   * Level 3–5: 1 pattern; Level 6+: 2 patterns; max 12 cells total.
   * Falls back to random scatter if pattern placement fails.
   * @param {number} level
   * @param {Array<{x: number, y: number}>} excludedCells
   */
  generate(level, excludedCells = []) {
    if (level < MIN_LEVEL_FOR_OBSTACLES) {
      this.cells = [];
      return;
    }

    const targetCount = Math.min(OBSTACLES_PER_LEVEL * (level - 2), MAX_OBSTACLES);
    const patternCount = level >= 6 ? 2 : 1;

    this.cells = [];
    const occupied = new Set(excludedCells.map((c) => `${c.x},${c.y}`));

    for (let i = 0; i < patternCount && this.cells.length < targetCount; i++) {
      const pattern = this._pickRandomPattern();
      const placed = this._tryPlacePattern(pattern, occupied);
      if (placed.length > 0) {
        placed.forEach((cell) => {
          this.cells.push(cell);
          occupied.add(`${cell.x},${cell.y}`);
        });
      }
    }

    // Fill remaining quota with random scatter
    while (this.cells.length < targetCount) {
      const freeCells = [];
      for (let x = 0; x < this.gridWidth; x++) {
        for (let y = 0; y < this.gridHeight; y++) {
          if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
        }
      }
      if (freeCells.length === 0) break;
      const idx = Math.floor(Math.random() * freeCells.length);
      this.cells.push(freeCells[idx]);
      occupied.add(`${freeCells[idx].x},${freeCells[idx].y}`);
    }
  }

  /**
   * Attempt to place a pattern at a random origin point.
   * Returns placed cells, or empty array if all attempts fail.
   * @param {Array<{dx: number, dy: number}>} pattern
   * @param {Set<string>} occupied
   * @returns {Array<{x: number, y: number}>}
   */
  _tryPlacePattern(pattern, occupied) {
    for (let attempt = 0; attempt < MAX_PATTERN_ATTEMPTS; attempt++) {
      const originX = Math.floor(Math.random() * this.gridWidth);
      const originY = Math.floor(Math.random() * this.gridHeight);
      const cells = pattern.map((p) => ({ x: originX + p.dx, y: originY + p.dy }));
      const valid = cells.every(
        (c) =>
          c.x >= 0 && c.x < this.gridWidth &&
          c.y >= 0 && c.y < this.gridHeight &&
          !occupied.has(`${c.x},${c.y}`)
      );
      if (valid) return cells;
    }
    return [];
  }

  _pickRandomPattern() {
    return PATTERNS[PATTERN_KEYS[Math.floor(Math.random() * PATTERN_KEYS.length)]];
  }

  checkCollision(x, y) {
    return this.cells.some((ob) => ob.x === x && ob.y === y);
  }

  getPositions() {
    return this.cells;
  }
}
