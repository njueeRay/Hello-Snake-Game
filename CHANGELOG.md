# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-02-25

First stable release. All planned v1.0 features complete.

### Added
- **Obstacle mode** — dynamic brick walls generated from Level 3 onward;
  count = min(2 × (level − 2), 12); reshuffled each level-up; collision = death
- **Special food system** — three food types with distinct mechanics:
  - 🟡 Golden (15%): +50 pts, no snake growth, expires in 8 s
  - 🔵 Blue (15%): +20 pts, snake grows, 3 s speed debuff (+60 ms/tick), expires in 6 s
  - 🔴 Normal (70%): +10 pts, snake grows
  - Expiring foods flash for the final 2 s before despawning
- **Difficulty selection** — Easy / Normal / Hard with distinct initial speed,
  speed step, and minimum speed presets
- **Sound effects** — fully synthesized via Web Audio API (no audio files):
  eat blip, level-up arpeggio, death descent, pause click, golden bonus chime
- **Mute toggle** — `M` key or on-screen button; state shown via button style
- **Progressive level system** — level up every 5 foods eaten; displayed in HUD
- **High score persistence** — `localStorage` with try/catch for private-mode safety
- **Visual effects system** — expanding eat rings (color-coded per food type),
  floating score popups (`+10`/`+20`/`+50`), death radial flash, blue debuff indicator
- **Food breathing animation** — sin-wave ±10 % scale pulse on all food types
- **Win condition** — snake fills entire 30×30 grid triggers YOU WIN overlay
- **Direction input queue** — max-2 buffered inputs, validates against last-queued
  direction to prevent 180° reversal
- **Mobile touch controls** — swipe to steer (20 px threshold), tap to pause/resume
- **HiDPI / Retina support** — canvas scaled by `devicePixelRatio`
- **GitHub Pages auto-deploy** — GitHub Actions workflow on push to `master`
- **Open-source documentation** — README, LICENSE (MIT), CONTRIBUTING, Issue Templates

### Technical
- `src/obstacles.js` — new `Obstacles` class with `generate()`, `checkCollision()`, `getPositions()`
- `src/food.js` — `spawn(snakeBody, obstacles)` excludes obstacle cells from free-cell enumeration
- `src/renderer.js` — `drawObstacles()` brick tiles; `drawFood(food, timestamp)` dispatches
  per type; per-type colored effect rings and score popups
- `src/game.js` — state machine (`idle → playing ⇌ paused → gameover | won`);
  unified `this.effects[]` array; `_setFoodExpiry()`; speed debuff tracking
- `src/audio.js` — lazy `AudioContext`; `_scheduleNote()` helper prevents closure-in-loop;
  `playBonus()` two-note chime for golden food
- `.claude/settings.json` — `Bash(*)` allow-all with targeted deny list, enabling
  non-interactive sub-agent bash execution

---

## [Unreleased] — v2.0 in progress

### Sprint 6 planned
- Time Attack mode (60 s countdown, fixed snake length)
- Snake skin selector (4 color schemes, localStorage memory)
- Structured obstacle patterns (predefined shapes replacing pure random)

### Sprint 7 planned
- Background music (oscillator ambient loop, tempo-coupled to speed)
- Tech debt: renderer magic-number constants, game.js module split evaluation
- v2.0.0 release

---

## [2.0-sprint5] — 2026-02-25

### Added
- **Local Top-10 Leaderboard** — `src/leaderboard.js` new module; stores
  `{score, level, difficulty, maxCombo, date}` in `localStorage`
  (`snakeLeaderboard`); `add()` returns 1-based rank; displayed in-game-over
  overlay (top 5) and via dedicated "🏆 TOP 10" button on start screen
- **Combo / Multiplier System** — consecutive food eaten within 25 ticks
  builds a combo counter; score multipliers: ×1.5 (combo 3+), ×2 (combo 6+),
  ×3 (combo 10+); combo HUD element shown/hidden by tier; `comboFlash` canvas
  effect shows multiplier label on tier change; max-combo tracked per game and
  saved to leaderboard
- **Enhanced Pause Menu** — pause overlay now shows: current score, level,
  difficulty, elapsed time, max combo; "Abandon Game" button returns to start
  screen with full resource cleanup
- **New-Record Badge** — animated badge appears in game-over overlay when the
  player achieves a leaderboard rank

### Technical
- `src/leaderboard.js` — new `Leaderboard` class with `add()` / `getAll()`;
  sorted desc by score, capped at 10 entries
- `src/game.js` — `COMBO_WINDOW_TICKS`, `COMBO_MULTIPLIERS` constants; new
  fields `_combo`, `_maxCombo`, `_ticksSinceFd`, `_gameStartMs`; `_abandon()`
  fixed with complete null cleanup of `snake/food/obstacles/effects`
- `src/ui.js` — `updateCombo()`, `showLeaderboard()` / `hideLeaderboard()`;
  `_renderLeaderboardRows()` uses `createElement` (no `innerHTML`); `showPause()`
  accepts stats object; `showGameOver()` / `showVictory()` accept rank param
- `src/renderer.js` — `comboFlash` branch in `drawEffects()`: alpha-fade +
  scale-grow animation centred on canvas
- `index.html` — `#comboItem` HUD slot; `#leaderboardButton`; `#newRecordBadge`;
  `#gameOverLbBody`; enhanced pause overlay stats grid; `#leaderboardOverlay`
- `style.css` — combo tier colours (mid/high/max), pulse keyframe, leaderboard
  table styles, new-record badge animation, pause stats grid, abandon button

---

[1.0.0]: https://github.com/njueeRay/Hello-Snake-Game/releases/tag/v1.0.0
