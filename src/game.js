import { Snake } from './snake.js';
import { Food } from './food.js';
import { Renderer, SNAKE_SKINS } from './renderer.js';
import { UI } from './ui.js';
import { AudioSystem } from './audio.js';
import { Obstacles } from './obstacles.js';
import { Leaderboard } from './leaderboard.js';

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
const LS_KEY_SKIN = 'snakeSkin';
const SWIPE_THRESHOLD = 20;

const TIME_ATTACK_MS = 60000;

/** 连击窗口：吃完食物后N格移动内吃到下一个食物则连击 */
const COMBO_WINDOW_TICKS = 25;

/** combo数量对应的分数倍数 */
const COMBO_MULTIPLIERS = [
  { minCombo: 10, mult: 3.0 },
  { minCombo: 6,  mult: 2.0 },
  { minCombo: 3,  mult: 1.5 },
  { minCombo: 0,  mult: 1.0 },
];

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
    this.obstacles = null;

    /** Extra ms added to tick interval while blue debuff is active. */
    this.speedDebuff = 0;
    this.speedDebuffUntil = null;

    // Combo & leaderboard
    this.leaderboard   = new Leaderboard();
    this.snakeSkin     = this._loadSkin();
    this._combo        = 0;
    this._maxCombo     = 0;
    this._ticksSinceFd = 0;   // ticks elapsed since last food eaten
    this._gameStartMs  = 0;   // Date.now() when game started

    // Game mode
    this.gameMode = { type: 'classic', allowGrowth: true };
    this.timerRemaining = 0;
    this._lastFrameTs = 0;

    this._bindInput();
    this._bindTouchInput();
    this._bindDifficultyButtons();
    this._drawIdleScreen();
  }

  _drawIdleScreen() {
    this.renderer.clear();
    this.renderer.drawGrid(0);
    this.renderer.drawSnake(
      [{ x: 15, y: 15 }, { x: 14, y: 15 }, { x: 13, y: 15 }, { x: 12, y: 15 }],
      this.snakeSkin
    );
  }

  /** @param {'easy'|'normal'|'hard'} difficulty */
  startClassic(difficulty) {
    this.difficulty = difficulty;
    this.gameMode = { type: 'classic', allowGrowth: true };
    this.timerRemaining = 0;
    this._updateActiveDifficultyButton();
    this._startGame();
  }

  /** @param {'easy'|'normal'|'hard'} difficulty */
  startTimeAttack(difficulty) {
    this.difficulty = difficulty;
    this.gameMode = { type: 'timeattack', allowGrowth: false };
    this.timerRemaining = TIME_ATTACK_MS;
    this._updateActiveDifficultyButton();
    this._startGame();
  }

  _startGame() {
    this.start();
  }

  _loadSkin() {
    try {
      const s = localStorage.getItem(LS_KEY_SKIN);
      return SNAKE_SKINS[s] ? s : 'classic';
    } catch { return 'classic'; }
  }

  setSkin(key) {
    if (!SNAKE_SKINS[key]) return;
    this.snakeSkin = key;
    try { localStorage.setItem(LS_KEY_SKIN, key); } catch {}
    this._updateActiveSkinButton();
    if (this.state === 'idle') this._drawIdleScreen();
  }

  _updateActiveSkinButton() {
    document.querySelectorAll('[data-skin]').forEach((btn) =>
      btn.classList.toggle('btn-skin--active', btn.dataset.skin === this.snakeSkin)
    );
  }

  start() {
    const preset = DIFFICULTY_PRESETS[this.difficulty];

    this.snake = new Snake(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
    this.food = new Food(GRID_SIZE, GRID_SIZE);
    this.obstacles = new Obstacles(GRID_SIZE, GRID_SIZE);
    this.score = 0;
    this.level = 1;
    this.foodEaten = 0;
    this.tickInterval = preset.initialSpeed;
    this.lastTickTime = 0;
    this.effects = [];
    this.speedDebuff = 0;
    this.speedDebuffUntil = null;
    this._combo        = 0;
    this._maxCombo     = 0;
    this._ticksSinceFd = 0;
    this._gameStartMs  = Date.now();
    this.food.spawn(this.snake.body, []);
    this._setFoodExpiry();
    this.obstacles.generate(this.level, [...this.snake.body, this.food.position]);

    this.ui.updateScore(0);
    this.ui.updateLevel(1);
    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    this.ui.hideVictory();
    this.ui.hidePause();

    this.state = 'playing';
    this._lastFrameTs = 0;
    this.ui.updateTimer(this.timerRemaining, this.gameMode.type);
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  _loop(timestamp) {
    if (this.state !== 'playing') return;

    // Time Attack countdown
    if (this.gameMode.type === 'timeattack') {
      if (this._lastFrameTs > 0) {
        this.timerRemaining -= (timestamp - this._lastFrameTs);
        this.ui.updateTimer(this.timerRemaining, 'timeattack');
        if (this.timerRemaining <= 0) {
          this.timerRemaining = 0;
          this._gameOver();
          return;
        }
      }
    }
    this._lastFrameTs = timestamp;

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
      this.food.spawn(this.snake.body, this.obstacles.getPositions());
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

    this._ticksSinceFd++;
    // Break combo if window exceeded
    if (this._ticksSinceFd > COMBO_WINDOW_TICKS && this._combo > 0) {
      this._combo = 0;
      this.ui.updateCombo(0);
    }

    if (
      this.snake.checkWallCollision(GRID_SIZE, GRID_SIZE) ||
      this.snake.checkSelfCollision() ||
      this.obstacles.checkCollision(this.snake.head.x, this.snake.head.y)
    ) {
      this._gameOver();
      return;
    }

    const { head } = this.snake;
    const fp = this.food.position;

    if (head.x === fp.x && head.y === fp.y) {
      const { type } = this.food;
      const pts = FOOD_POINTS[type] ?? 10;

      // Golden food / Time Attack mode: no growth
      if (this.gameMode.allowGrowth && type !== 'golden') {
        this.snake.grow();
      }

      // Combo logic
      if (this._ticksSinceFd <= COMBO_WINDOW_TICKS) {
        this._combo++;
      } else {
        this._combo = 1;
      }
      this._ticksSinceFd = 0;
      if (this._combo > this._maxCombo) this._maxCombo = this._combo;
      const multiplier = COMBO_MULTIPLIERS.find(c => this._combo >= c.minCombo).mult;

      this.score += Math.round(pts * multiplier);
      this.foodEaten += 1;
      this.ui.updateScore(this.score);
      this.ui.updateCombo(this._combo);
      // Combo tier change effect
      if (multiplier > 1) {
        this.effects.push({
          type: 'comboFlash',
          mult: multiplier,
          x: Math.floor(GRID_SIZE / 2),
          y: Math.floor(GRID_SIZE / 2),
          startTime: this.currentTime,
          duration: 700,
        });
      }
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
        value: Math.round(pts * multiplier),
        x: fp.x, y: fp.y,
        startTime: this.currentTime,
        duration: EFFECT_SCORE_POPUP_DURATION,
      });

      this.food.spawn(this.snake.body, this.obstacles.getPositions());
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
      this.obstacles.generate(this.level, [
        ...this.snake.body,
        this.food.position,
      ]);
    }
  }

  _render(timestamp = 0) {
    if (!this.food || !this.obstacles) return;
    this.renderer.clear();
    this.renderer.drawGrid(this.score);
    this.renderer.drawObstacles(this.obstacles.getPositions());
    this.renderer.drawFood(this.food, timestamp);
    this.renderer.drawEffects(this.effects, timestamp);
    this.renderer.drawSnake(this.snake.body, this.snakeSkin);
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
    const rank = this.leaderboard.add({
      score:      this.score,
      level:      this.level,
      difficulty: this.difficulty,
      maxCombo:   this._maxCombo,
      mode:       this.gameMode.type,
    });
    this.ui.showGameOver(this.score, this.highScore, this.leaderboard.getAll(), rank);
  }

  _gameWon() {
    if (this.gameMode.type === 'timeattack') return;
    this._saveHighScore();
    this.state = 'won';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.audio.playLevelUp();
    this._render(this.currentTime);
    const rank = this.leaderboard.add({
      score:      this.score,
      level:      this.level,
      difficulty: this.difficulty,
      maxCombo:   this._maxCombo,
      mode:       this.gameMode.type,
    });
    this.ui.showVictory(this.score, this.highScore, rank);
  }

  _pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.audio.playPause();
    this.ui.showPause({
      score:     this.score,
      level:     this.level,
      difficulty: this.difficulty.toUpperCase(),
      elapsed:   Date.now() - this._gameStartMs,
      maxCombo:  this._maxCombo,
    });
  }

  _resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastTickTime = 0;
    this._lastFrameTs = 0;
    this.ui.hidePause();
    this.animFrameId = requestAnimationFrame((ts) => this._loop(ts));
  }

  _abandon() {
    if (this.state !== 'paused') return;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.snake     = null;
    this.food      = null;
    this.obstacles = null;
    this.effects   = [];
    this.state = 'idle';
    this.ui.hidePause();
    this.ui.showStartScreen();
    this._drawIdleScreen();
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
      case 'idle':     this.startClassic(this.difficulty);    break;
      case 'gameover':
      case 'won':      this.startClassic(this.difficulty);    break;
      case 'playing':  this._pause();   break;
      case 'paused':   this._resume();  break;
      default: break;
    }
  }

  _bindDifficultyButtons() {
    // Mode toggle buttons — update data-mode on difficulty buttons
    document.querySelectorAll('[data-mode-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.modeSelect;
        document.querySelectorAll('[data-difficulty]').forEach((b) => { b.dataset.mode = m; });
        document.querySelectorAll('[data-mode-select]').forEach((b) =>
          b.classList.toggle('btn-mode--active', b.dataset.modeSelect === m)
        );
      });
    });
    // Difficulty buttons — route to classic or time attack start
    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = btn.dataset.difficulty;
        const m = btn.dataset.mode || 'classic';
        if (m === 'timeattack') {
          this.startTimeAttack(d);
        } else {
          this.startClassic(d);
        }
      });
    });
    const muteBtn = document.getElementById('muteButton');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.audio.muted = !this.audio.muted;
        this.ui.updateMuteButton(this.audio.muted);
      });
    }
    const lbBtn = document.getElementById('leaderboardButton');
    if (lbBtn) {
      lbBtn.addEventListener('click', () => this.ui.showLeaderboard(this.leaderboard.getAll()));
    }
    const lbClose = document.getElementById('leaderboardClose');
    if (lbClose) {
      lbClose.addEventListener('click', () => this.ui.hideLeaderboard());
    }
    const abandonBtn = document.getElementById('abandonButton');
    if (abandonBtn) {
      abandonBtn.addEventListener('click', () => this._abandon());
    }
    this._updateActiveDifficultyButton();
    document.querySelectorAll('[data-skin]').forEach((btn) =>
      btn.addEventListener('click', () => this.setSkin(btn.dataset.skin))
    );
    this._updateActiveSkinButton();
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
