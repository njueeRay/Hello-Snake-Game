# Contributing to Hello Snake Game

Thank you for your interest in contributing! This is a pure HTML5 Canvas + Vanilla JS project — no build toolchain, no frameworks. Contributions should keep it that way.

## Ground Rules

- **No frameworks or libraries** — pure Vanilla JS (ES6+) only
- **No build steps** — the game runs directly from `index.html` via a static server
- **Respect the code conventions** in [CLAUDE.md](CLAUDE.md)
- Be respectful and constructive in all discussions

## How to Contribute

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/Hello-Snake-Game.git
cd Hello-Snake-Game
```

### 2. Create a Branch
```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming convention:
- `feat/` — new feature
- `fix/` — bug fix
- `docs/` — documentation only
- `refactor/` — code restructure with no behavior change

### 3. Run Locally
```bash
python -m http.server 8080
# open http://localhost:8080
```

### 4. Make Your Changes

Follow the code conventions in [CLAUDE.md](CLAUDE.md):
- `const`/`let` only — no `var`
- ES6 classes, arrow functions, template literals
- `type="module"` — proper ES6 imports/exports
- No inline styles — use CSS classes
- No `document.write()` or `eval()`
- No DOM string concatenation — use `createElement`

### 5. Test Manually

Before submitting, verify in at least one modern browser:
- [ ] Game starts, snake moves, food spawns
- [ ] Collision detection works (walls + self)
- [ ] Direction queue: rapid keys don't cause 180° reversal
- [ ] Score, level, high score all update correctly
- [ ] Mobile swipe controls work (or DevTools device emulation)
- [ ] HiDPI looks sharp (zoom browser to 150%+)
- [ ] All overlays appear/dismiss correctly

### 6. Commit
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add obstacle mode triggered at score 50
fix: prevent double food spawn on rapid level-up
docs: update README with obstacle mode section
refactor: extract effect rendering into separate methods
```

### 7. Open a Pull Request

- Target branch: `master`
- Describe **what** you changed and **why**
- Include before/after screenshots for visual changes
- Reference any related issue: `Closes #42`

## What We Welcome

- Bug fixes
- Performance improvements to the Canvas rendering
- New game features (obstacles, special food, etc.)
- Visual enhancements that fit the dark aesthetic
- Documentation improvements
- Accessibility improvements

## What We Won't Accept

- External dependencies (`npm install anything`)
- Framework rewrites (React, Vue, etc.)
- Breaking the pure static serving (no bundler requirement)
- Features that significantly hurt mobile experience

## Reporting Bugs

Open an [issue](https://github.com/njueeRay/Hello-Snake-Game/issues) with:
- Browser + OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshot or screen recording if applicable

## Questions?

Open a [Discussion](https://github.com/njueeRay/Hello-Snake-Game/discussions) rather than an issue for questions and ideas.
