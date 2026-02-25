import { Snake } from './snake.js';
import { Food } from './food.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { AudioSystem } from './audio.js';

const CANVAS_SIZE = 600;
const CELL_SIZE = 20;
const GRID_SIZE = CANVAS_SIZE / CELL_SIZE; // 30

const DIFFICULTY_PRESETS = {
  easy:   { initialSpeed: 200, speedStep: 3, minSpeed: 100 },
  normal: { initialSpeed: 150, speedStep: 5, minSpeed:  50 },
  hard:   { initialSpeed:  90, speedStep: 8, minSpeed:  30 },
};

const FOODS_PER_SPEEDUP = 5;

/** Points awarded per food type. */
const FOOD_POINTS = { normal: 10, golden: 50, blue: 20 };

/** How long special foods stay on the board before expiring (ms). */
const FOOD_EXPIRE_MS = { golden: 8000, blue: 6000 };

/** Speed debuff added to tickInterval when blue food is eaten (ms). */
const BLUE_DEBUFF_MS = 60;
/** How long the blue food speed debuff lasts (ms). */
const BLUE_DEBUFF_DURATION = 3000;

const EFFECT_FOOD_EATEN_DURATION = 400;
const EFFECT_SCORE_POPUP_DURATION = 800;
const EFFECT_DEBUFF_DURATION = 500;

const LS_KEY_HIGH_SCORE = 'snakeHighScore';
const SWIPE_THRESHOLD = 20;

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
    this.audio = new AudioSystem();

    this.highScore = this._loadHighScore();
    this.ui.updateHighScore(this.highScore);

    this.difficulty = 'normal';
    this.state = 'idle';
    this.snake = null;
    this.food = null;
    this.score = 0;
    this.level = 1;
    this.foodEaten = 0;
    this.tickInterval = DIFFICULTY_PRESETS.normal.initialSpeed;
    this.lastTickTime = 0;
    this.animFrameId = null;
    this.currentTime = 0;
    this.effects = [];

    /** Extra ms added to tick interval while blue debuff is active. */
    this.speedDebuff = 0;
    this.speedDebuffUntil = null;

    this._bindInput();
    this._bindTouchInput();
    this._bindDifficultyButtons();
    this._drawIdleScreen();
  }

  _drawIdleScreen() {
    this.renderer.clear();
    this.renderer.drawGrid(0);
  }

  /** @param {'easy'|'normal'|'hard'} key */
  startWithDifficulty(key) {
    this.difficulty = key;
    this._updateActiveDifficultyButton();
    this.start();
  }

  start() {
    const preset = DIFFICULTY_PRESETS[this.difficulty];

    this.snake = new Snake(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
    this.food = new Food(GRID_SIZE, GRID_SIZE);
    this.food.spawn(this.snake.body);
    this._setFoodExpiry();

    this.score = 0;
    this.level = 1;
    this.foodEaten = 0;
    this.tickInterval = preset.initialSpeed;
    this.lastTickTime = 0;
    this.effects = [];
    this.speedDebuff = 0;
    this.speedDebuffUntil = null;

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
    if (this.lastTickTime === 0) this.lastTickTime = timestamp;

    // Purge expired effects
    this.effects = this.effects.filter((fx) => timestamp - fx.startTime < fx.duration);

    // Expire speed debuff
    if (this.speedDebuffUntil !== null && timestamp >= this.speedDebuffUntil) {
      this.speedDebuff = 0;
      this.speedDebuffUntil = null;
    }

    // Expire timed special food (respawn if not eaten in time)
    if (this.food.expireAt !== null && timestamp >= this.food.expireAt) {
      this.food.spawn(this.snake.body);
      this._setFoodExpiry();
    }

    const effectiveInterval = this.tickInterval + this.speedDebuff;
    if (timestamp - this.lastTickTime >= effectiveInterval) {
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
      const { type } = this.food;
      const pts = FOOD_POINTS[type] ?? 10;

      // Golden food doesn't grow the snake
      if (type !== 'golden') {
        this.snake.grow();
      }

      this.score += pts;
      this.foodEaten += 1;
      this.ui.updateScore(this.score);
      this._adjustSpeed();
      this._saveHighScore();

      // Audio: golden gets bonus chime, others get eat blip
      if (type === 'golden') {
        this.audio.playBonus();
      } else {
        this.audio.playEat();
      }

      // Apply blue food speed debuff
      if (type === 'blue') {
        this.speedDebuff = BLUE_DEBUFF_MS;
        this.speedDebuffUntil = this.currentTime + BLUE_DEBUFF_DURATION;
        this.effects.push({
          type: 'debuffActive',
          x: head.x, y: head.y,
          startTime: this.currentTime,
          duration: EFFECT_DEBUFF_DURATION,
        });
      }

      this.effects.push({
        type: 'foodEaten',
        foodType: type,
        x: fp.x, y: fp.y,
        startTime: this.currentTime,
        duration: EFFECT_FOOD_EATEN_DURATION,
      });
      this.effects.push({
        type: 'scorePopup',
        foodType: type,
        value: pts,
        x: fp.x, y: fp.y,
        startTime: this.currentTime,
        duration: EFFECT_SCORE_POPUP_DURATION,
      });

      this.food.spawn(this.snake.body);
      this._setFoodExpiry();

      if (this.food.position.x === -1) {
        this._gameWon();
      }
    }
  }

  /** Stamp expiry timestamps on the food object after each spawn. */
  _setFoodExpiry() {
    const duration = FOOD_EXPIRE_MS[this.food.type] ?? null;
    this.food.spawnedAt = this.currentTime;
    this.food.expireAt = duration !== null ? this.currentTime + duration : null;
  }

  _adjustSpeed() {
    const preset = DIFFICULTY_PRESETS[this.difficulty];
    const tier = Math.floor(this.foodEaten / FOODS_PER_SPEEDUP);
    this.tickInterval = Math.max(
      preset.initialSpeed - tier * preset.speedStep,
      preset.minSpeed
    );
    const newLevel = tier + 1;
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.ui.updateLevel(this.level);
      this.audio.playLevelUp();
    }
  }

  _render(timestamp = 0) {
    this.renderer.clear();
    this.renderer.drawGrid(this.score);
    this.renderer.drawFood(this.food, timestamp);
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
    this.audio.playDeath();
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
    this.audio.playLevelUp();
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
    this.audio.playPause();
    this.ui.showPause(this.score);
  }

  _resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastTickTime = 0;
    this.ui.hidePause();
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  // ---- High score ----

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
        // localStorage unavailable — ignore
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
      return;
    }
    if (event.key === 'm' || event.key === 'M') {
      this.audio.muted = !this.audio.muted;
      this.ui.updateMuteButton(this.audio.muted);
    }
  }

  _handleSpace() {
    switch (this.state) {
      case 'idle':     this.start();    break;
      case 'gameover':
      case 'won':      this.start();    break;
      case 'playing':  this._pause();   break;
      case 'paused':   this._resume();  break;
      default: break;
    }
  }

  _bindDifficultyButtons() {
    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.startWithDifficulty(btn.dataset.difficulty);
      });
    });
    const muteBtn = document.getElementById('muteButton');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.audio.muted = !this.audio.muted;
        this.ui.updateMuteButton(this.audio.muted);
      });
    }
    this._updateActiveDifficultyButton();
  }

  _updateActiveDifficultyButton() {
    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.classList.toggle('btn-difficulty--active', btn.dataset.difficulty === this.difficulty);
    });
  }

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
