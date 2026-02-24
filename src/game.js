import { Snake } from './snake.js';
import { Food } from './food.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';

const CANVAS_SIZE = 600;
const CELL_SIZE = 20;
const GRID_SIZE = CANVAS_SIZE / CELL_SIZE; // 30

const INITIAL_SPEED = 150;
const SPEED_STEP = 5;
const FOODS_PER_SPEEDUP = 5;
const MIN_SPEED = 50;
const SCORE_PER_FOOD = 10;

const EFFECT_FOOD_EATEN_DURATION = 400;
const EFFECT_SCORE_POPUP_DURATION = 800;

const LS_KEY_HIGH_SCORE = 'snakeHighScore';

const SWIPE_THRESHOLD = 20; // px minimum swipe distance

const KEY_MAP = {
  ArrowUp: 'up',   w: 'up',   W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

/**
 * Main game controller.
 * State machine: idle -> playing <-> paused -> gameover | won
 */
class Game {
  constructor() {
    const canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(canvas, CELL_SIZE);
    this.ui = new UI();

    this.highScore = this._loadHighScore();
    this.ui.updateHighScore(this.highScore);

    this.state = 'idle';
    this.snake = null;
    this.food = null;
    this.score = 0;
    this.level = 1;
    this.foodEaten = 0;
    this.tickInterval = INITIAL_SPEED;
    this.lastTickTime = 0;
    this.animFrameId = null;
    this.currentTime = 0;

    /** Active particle/popup effects. */
    this.effects = [];

    this._bindInput();
    this._bindTouchInput();
    this._drawIdleScreen();
  }

  _drawIdleScreen() {
    this.renderer.clear();
    this.renderer.drawGrid(0);
  }

  start() {
    this.snake = new Snake(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
    this.food = new Food(GRID_SIZE, GRID_SIZE);
    this.food.spawn(this.snake.body);

    this.score = 0;
    this.level = 1;
    this.foodEaten = 0;
    this.tickInterval = INITIAL_SPEED;
    this.lastTickTime = 0;
    this.effects = [];

    this.ui.updateScore(0);
    this.ui.updateLevel(1);
    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    this.ui.hideVictory();
    this.ui.hidePause();

    this.state = 'playing';
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  _loop(timestamp) {
    if (this.state !== 'playing') return;

    this.currentTime = timestamp;

    if (this.lastTickTime === 0) {
      this.lastTickTime = timestamp;
    }

    // Purge expired effects each frame
    this.effects = this.effects.filter(
      (fx) => timestamp - fx.startTime < fx.duration
    );

    if (timestamp - this.lastTickTime >= this.tickInterval) {
      this.lastTickTime = timestamp;
      this._update();
    }

    this._render(timestamp);
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

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
      this._saveHighScore();

      // Visual effects for eating food
      this.effects.push({
        type: 'foodEaten',
        x: fp.x,
        y: fp.y,
        startTime: this.currentTime,
        duration: EFFECT_FOOD_EATEN_DURATION,
      });
      this.effects.push({
        type: 'scorePopup',
        x: fp.x,
        y: fp.y,
        startTime: this.currentTime,
        duration: EFFECT_SCORE_POPUP_DURATION,
      });

      this.food.spawn(this.snake.body);

      // Win: snake fills the entire grid
      if (this.food.position.x === -1) {
        this._gameWon();
      }
    }
  }

  _adjustSpeed() {
    const tier = Math.floor(this.foodEaten / FOODS_PER_SPEEDUP);
    this.tickInterval = Math.max(INITIAL_SPEED - tier * SPEED_STEP, MIN_SPEED);
    const newLevel = tier + 1;
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.ui.updateLevel(this.level);
    }
  }

  _render(timestamp = 0) {
    this.renderer.clear();
    this.renderer.drawGrid(this.score);
    this.renderer.drawFood(this.food.position, timestamp);
    this.renderer.drawEffects(this.effects, timestamp);
    this.renderer.drawSnake(this.snake.body);
  }

  _gameOver() {
    this._saveHighScore();
    this.state = 'gameover';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this._render(this.currentTime);
    this.renderer.drawDeathFlash(this.snake.head);
    this.ui.showGameOver(this.score, this.highScore);
  }

  _gameWon() {
    this._saveHighScore();
    this.state = 'won';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this._render(this.currentTime);
    this.ui.showVictory(this.score, this.highScore);
  }

  _pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.ui.showPause(this.score);
  }

  _resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastTickTime = 0;
    this.ui.hidePause();
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  // ---- High score persistence ----

  _loadHighScore() {
    try {
      return parseInt(localStorage.getItem(LS_KEY_HIGH_SCORE) || '0', 10);
    } catch {
      return 0;
    }
  }

  _saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.ui.updateHighScore(this.highScore);
      try {
        localStorage.setItem(LS_KEY_HIGH_SCORE, String(this.highScore));
      } catch {
        // localStorage unavailable (private mode, etc.) — gracefully ignore
      }
    }
  }

  // ---- Input ----

  _bindInput() {
    document.addEventListener('keydown', (e) => this._handleKey(e));
  }

  _handleKey(event) {
    const dir = KEY_MAP[event.key];
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
      case 'won':
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

  /** Swipe-to-control for mobile browsers. */
  _bindTouchInput() {
    const canvas = document.getElementById('gameCanvas');
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      // Tap (no significant swipe) -> space action
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        this._handleSpace();
        return;
      }

      if (this.state === 'playing') {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.snake.setDirection(dx > 0 ? 'right' : 'left');
        } else {
          this.snake.setDirection(dy > 0 ? 'down' : 'up');
        }
      }
    }, { passive: false });
  }
}

const game = new Game();
