# 🐍 Hello Snake Game

[![Play Online](https://img.shields.io/badge/Play-Online-00e676?style=for-the-badge&logo=github)](https://njueeray.github.io/Hello-Snake-Game/)
[![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen?style=for-the-badge)](https://github.com/njueeRay/Hello-Snake-Game/releases/tag/v1.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f0db4f?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-e34c26?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

A modern, feature-complete Snake game built with pure HTML5 Canvas and Vanilla JavaScript — no frameworks, no dependencies, just clean ES6+ code.

## 🎮 Play Now

**[👉 Play in Browser](https://njueeray.github.io/Hello-Snake-Game/)**

Or run locally in 10 seconds:
```bash
git clone https://github.com/njueeRay/Hello-Snake-Game.git
cd Hello-Snake-Game
python -m http.server 8080
# open http://localhost:8080
```

## ✨ Features

| Feature | Details |
|---------|---------|
| 🎯 **Difficulty Modes** | Easy / Normal / Hard with distinct speed curves |
| 📈 **Progressive Speed** | Level up every 5 foods, speed increases dynamically |
| 🧱 **Obstacle Mode** | Dynamic walls appear from Level 3, scaling with each level |
| 🌟 **Special Foods** | Golden (+50 pts, no growth) · Blue (+20 pts, speed debuff) · Normal (+10 pts) |
| 🏆 **High Score** | Persisted locally via `localStorage` |
| 🎵 **Sound Effects** | Synthesized via Web Audio API — zero audio files |
| ✨ **Visual Effects** | Eat ring flash · score popup · death radial glow · food expiry flash |
| 💫 **Breathing Food** | Sin-wave pulse animation on food |
| 📱 **Mobile Support** | Swipe to steer, tap for pause/resume |
| 🖥️ **HiDPI Ready** | Auto-scales for Retina / high-DPI displays |
| 🏅 **Win Condition** | Fill the entire 30×30 grid for `YOU WIN` |
| 🔇 **Mute Toggle** | `M` key or on-screen button |

## 🕹️ How to Play

### Keyboard
| Key | Action |
|-----|--------|
| `Space` | Start · Pause · Resume |
| `↑ W` | Move Up |
| `↓ S` | Move Down |
| `← A` | Move Left |
| `→ D` | Move Right |
| `M` | Toggle Mute |

### Mobile
- **Swipe** to change direction
- **Tap** to Start / Pause / Resume

### Rules
- Eat food to grow and score points
- Avoid hitting walls, your own body, or obstacles
- Every 5 foods = Level Up + increased speed
- **Food types:**
  - 🔴 **Normal** — +10 pts, snake grows
  - 🟡 **Golden** (15% chance) — +50 pts, no growth, expires in 8s
  - 🔵 **Blue** (15% chance) — +20 pts, snake grows, temporary speed reduction, expires in 6s
- **Obstacles** appear from Level 3 onward, adding 2 blocks per level (max 12), reshuffled each level-up
- Fill the entire grid = **Victory** 🏆

## 🏗️ Architecture

```
Snake/
├── index.html          # Entry point, DOM structure
├── style.css           # Dark theme, all visual styles
└── src/
    ├── game.js         # Game controller & state machine
    ├── snake.js        # Snake entity, movement, collision
    ├── food.js         # Food placement & type selection
    ├── obstacles.js    # Dynamic obstacle generation
    ├── renderer.js     # Canvas drawing, effects system
    ├── ui.js           # DOM-only UI manager
    └── audio.js        # Web Audio API sound synthesizer
```

**State Machine:** `idle → [difficulty] → playing ⇌ paused → gameover | won`

**Key Design Decisions:**
- **Direction Queue** (max 2): prevents rapid-input from causing 180° reversal
- **Effects Array**: all particle effects managed centrally in `game.js`, rendered each rAF frame
- **Free-Cell Food Spawn**: O(grid_area) enumeration guarantees uniform distribution at any snake length, excludes obstacles
- **Lazy AudioContext**: created only on first user gesture, respecting browser autoplay policy
- **Obstacle Module**: `Obstacles.generate(level, excludedCells)` is stateless per call — safe to call on every level-up

## 🛠️ Tech Stack

- **HTML5 Canvas API** — rendering
- **Web Audio API** — synthesized sound effects
- **ES6 Modules** — `type="module"` for clean imports
- **localStorage** — high score persistence
- **CSS3** — animations, transitions, dark theme

Zero dependencies. No build step. Open `index.html` with a static server and go.

## 🚀 Getting Started

### Prerequisites
A modern browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+) and a local static server.

### Run Locally
```bash
# Option 1: Python
python -m http.server 8080

# Option 2: Node.js
npx serve .

# Option 3: VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then open [http://localhost:8080](http://localhost:8080).

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick start:**
1. Fork the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit: follow [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a Pull Request

## 🗺️ Roadmap

**v1.0.0 — Released** ✅

**v2.0 — In Planning** 🚧

| Sprint | Features |
|--------|---------|
| Sprint 5 (Depth) | Local Top-10 leaderboard · Combo/multiplier system · Enhanced pause menu |
| Sprint 6 (Variety) | Time Attack mode · Snake skin selector · Structured obstacle patterns |
| Sprint 7 (Polish) | Background music · Code quality cleanup · v2.0.0 release |

**v2.x — Future:**
- [ ] Online leaderboard (requires backend)
- [ ] Two-player mode (split keyboard)

## 📄 License

[MIT](LICENSE) © 2025 njueeRay
