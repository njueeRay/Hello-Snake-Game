/**
 * Direction vectors mapped by name.
 * Kept as a module-level constant so every method can reference it.
 */
const DIRECTION_VECTORS = {
  up:    { x:  0, y: -1 },
  down:  { x:  0, y:  1 },
  left:  { x: -1, y:  0 },
  right: { x:  1, y:  0 },
};

/**
 * Pairs of directions that are opposite to each other.
 * Used to block 180-degree reversals.
 */
const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export class Snake {
  /**
   * @param {number} startX - grid x of the head
   * @param {number} startY - grid y of the head
   * @param {number} [length=3] - initial body length
   */
  constructor(startX, startY, length = 3) {
    this.body = [];
    for (let i = 0; i < length; i++) {
      this.body.push({ x: startX - i, y: startY });
    }
    this.direction = 'right';
    this.nextDirection = 'right';
    this._growPending = false;
  }

  /** Head segment (convenience getter). */
  get head() {
    return this.body[0];
  }

  /**
   * Queue a direction change. Ignores 180-degree reversals and
   * same-direction repeats so rapid key presses cannot break the snake.
   * @param {'up'|'down'|'left'|'right'} dir
   */
  setDirection(dir) {
    if (!DIRECTION_VECTORS[dir]) return;
    if (OPPOSITES[dir] === this.nextDirection) return;
    this.nextDirection = dir;
  }

  /**
   * Advance the snake by one grid cell.
   * If grow() was called beforehand the tail is preserved.
   */
  move() {
    this.direction = this.nextDirection;
    const vec = DIRECTION_VECTORS[this.direction];
    const newHead = {
      x: this.head.x + vec.x,
      y: this.head.y + vec.y,
    };
    this.body.unshift(newHead);

    if (this._growPending) {
      this._growPending = false;
    } else {
      this.body.pop();
    }
  }

  /** Flag the snake to retain its tail on the next move(). */
  grow() {
    this._growPending = true;
  }

  /**
   * @param {number} gridWidth
   * @param {number} gridHeight
   * @returns {boolean} true if head is outside the grid
   */
  checkWallCollision(gridWidth, gridHeight) {
    const { x, y } = this.head;
    return x < 0 || y < 0 || x >= gridWidth || y >= gridHeight;
  }

  /** @returns {boolean} true if head overlaps any other body segment */
  checkSelfCollision() {
    const { x, y } = this.head;
    return this.body.some((seg, i) => i > 0 && seg.x === x && seg.y === y);
  }

  /**
   * Check whether a given grid position overlaps any body segment.
   * Used by Food to avoid spawning inside the snake.
   * @param {number} gx
   * @param {number} gy
   * @returns {boolean}
   */
  occupies(gx, gy) {
    return this.body.some((seg) => seg.x === gx && seg.y === gy);
  }
}
