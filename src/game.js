import { Snake } from './snake.js';
import { Food } from './food.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';

/** Grid & timing constants */
const CANVAS_SIZE = 600;
const CELL_SIZE = 20;
const GRID_SIZE = CANVAS_SIZE / CELL_SIZE; // 30

const INITIAL_SPEED = 150;   // ms per tick
const SPEED_STEP = 5;        // ms faster every N foods
const FOODS_PER_SPEEDUP = 5;
const MIN_SPEED = 50;        // speed floor
const SCORE_PER_FOOD = 10;

/** Map raw key values to canonical direction names. */
const KEY_MAP = {
  ArrowUp: 'up',    w: 'up',    W: 'up',
  ArrowDown: 'down',  s: 'down',  S: 'down',
  ArrowLeft: 'left',  a: 'left',  A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

/**
 * Main game controller.
 * State machine: IDLE -> PLAYING <-> PAUSED -> GAME_OVER -> IDLE ...
 */
class Game {
  constructor() {
    const canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(canvas, CELL_SIZE);
    this.ui = new UI();

    this.state = 'idle'; // 'idle' | 'playing' | 'paused' | 'gameover'
    this.snake = null;
    this.food = null;
    this.score = 0;
    this.foodEaten = 0;
    this.tickInterval = INITIAL_SPEED;
    this.lastTickTime = 0;
    this.animFrameId = null;

    this._bindInput();
    this._drawIdleScreen();
  }

  /** Render the grid once so the start screen has a background. */
  _drawIdleScreen() {
    this.renderer.clear();
    this.renderer.drawGrid();
  }

  /** Start (or restart) the game. */
  start() {
    this.snake = new Snake(
      Math.floor(GRID_SIZE / 2),
      Math.floor(GRID_SIZE / 2)
    );
    this.food = new Food(GRID_SIZE, GRID_SIZE);
    this.food.spawn(this.snake.body);

    this.score = 0;
    this.foodEaten = 0;
    this.tickInterval = INITIAL_SPEED;
    this.lastTickTime = 0;

    this.ui.updateScore(this.score);
    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    this.ui.hidePause();

    this.state = 'playing';
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  /** Core loop driven by requestAnimationFrame. */
  _loop(timestamp) {
    if (this.state !== 'playing') return;

    if (this.lastTickTime === 0) {
      this.lastTickTime = timestamp;
    }

    const elapsed = timestamp - this.lastTickTime;
    if (elapsed >= this.tickInterval) {
      this.lastTickTime = timestamp;
      this._update();
    }

    this._render();
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  /** One logical tick: move, collide, eat. */
  _update() {
    this.snake.move();

    if (
      this.snake.checkWallCollision(GRID_SIZE, GRID_SIZE) ||
      this.snake.checkSelfCollision()
    ) {
      this._gameOver();
      return;
    }

    const { head } = this.snake;
    const fp = this.food.position;
    if (head.x === fp.x && head.y === fp.y) {
      this.snake.grow();
      this.score += SCORE_PER_FOOD;
      this.foodEaten += 1;
      this.ui.updateScore(this.score);
      this._adjustSpeed();
      this.food.spawn(this.snake.body);
    }
  }

  /** Increase speed every FOODS_PER_SPEEDUP foods eaten. */
  _adjustSpeed() {
    const tier = Math.floor(this.foodEaten / FOODS_PER_SPEEDUP);
    this.tickInterval = Math.max(
      INITIAL_SPEED - tier * SPEED_STEP,
      MIN_SPEED
    );
  }

  /** Draw current frame. */
  _render() {
    this.renderer.clear();
    this.renderer.drawGrid();
    this.renderer.drawFood(this.food.position);
    this.renderer.drawSnake(this.snake.body);
  }

  /** Transition to game-over state. */
  _gameOver() {
    this.state = 'gameover';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    // Final render so the player sees where they died
    this._render();
    this.ui.showGameOver(this.score);
  }

  /** Pause the game. */
  _pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.ui.showPause();
  }

  /** Resume from pause. */
  _resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastTickTime = 0; // reset so elapsed doesn't spike
    this.ui.hidePause();
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  // ---- Input ----

  _bindInput() {
    document.addEventListener('keydown', (e) => this._handleKey(e));
  }

  _handleKey(event) {
    const dir = KEY_MAP[event.key];

    // Always suppress default for game-related keys (prevent page scroll)
    if (dir || event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }

    if (dir && this.state === 'playing') {
      this.snake.setDirection(dir);
      return;
    }

    if (event.key === ' ' || event.code === 'Space') {
      this._handleSpace();
    }
  }

  _handleSpace() {
    switch (this.state) {
      case 'idle':
      case 'gameover':
        this.start();
        break;
      case 'playing':
        this._pause();
        break;
      case 'paused':
        this._resume();
        break;
      default:
        break;
    }
  }
}

// Self-executing setup: instantiate the game once the module loads.
const game = new Game();
