/**
 * Direction vectors mapped by name.
 * Module-level constant shared across all methods.
 */
const DIRECTION_VECTORS = {
  up:    { x:  0, y: -1 },
  down:  { x:  0, y:  1 },
  left:  { x: -1, y:  0 },
  right: { x:  1, y:  0 },
};

const OPPOSITES = {
  up: 'down', down: 'up', left: 'right', right: 'left',
};

/** Maximum queued direction changes to buffer between ticks. */
const MAX_QUEUE_SIZE = 2;

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
    /** Input queue — stores up to MAX_QUEUE_SIZE pending direction changes. */
    this._directionQueue = [];
    this._growPending = false;
  }

  /** Head segment (convenience getter). */
  get head() {
    return this.body[0];
  }

  /**
   * Queue a direction change. Validates against the last queued direction
   * (not the current one) to prevent 180-degree reversals even on rapid input.
   * @param {'up'|'down'|'left'|'right'} dir
   */
  setDirection(dir) {
    if (!DIRECTION_VECTORS[dir]) return;
    const lastQueued = this._directionQueue.length > 0
      ? this._directionQueue[this._directionQueue.length - 1]
      : this.direction;
    if (OPPOSITES[dir] === lastQueued) return;
    if (this._directionQueue.length >= MAX_QUEUE_SIZE) return;
    this._directionQueue.push(dir);
  }

  /**
   * Advance the snake by one grid cell.
   * Consumes one direction from the queue, then moves.
   */
  move() {
    if (this._directionQueue.length > 0) {
      this.direction = this._directionQueue.shift();
    }
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
   * @param {number} gx
   * @param {number} gy
   * @returns {boolean}
   */
  occupies(gx, gy) {
    return this.body.some((seg) => seg.x === gx && seg.y === gy);
  }
}
