# Project: Snake Game (贪吃蛇)

技术栈：HTML5 Canvas + Vanilla JavaScript + CSS3

---

## 项目结构

```
Snake/
├── CLAUDE.md                 ← 本文件，项目核心规范
├── README.md                 ← 开源门面（徽章、功能、上手指南）
├── LICENSE                   ← MIT License
├── CONTRIBUTING.md           ← 贡献指南
├── .gitignore
├── .github/
│   ├── workflows/deploy.yml  ← GitHub Pages 自动部署
│   └── ISSUE_TEMPLATE/       ← Bug report / Feature request 模板
├── .claude/                  ← Claude Code 配置
│   ├── settings.json         ← 权限控制
│   ├── agents/               ← 专项 AI 团队
│   └── commands/             ← 自定义斜杠命令
├── index.html                ← 游戏入口页面
├── src/
│   ├── game.js               ← 游戏核心逻辑 + 状态机
│   ├── snake.js              ← 蛇的实体与行为
│   ├── food.js               ← 食物生成逻辑
│   ├── renderer.js           ← Canvas 渲染层
│   ├── ui.js                 ← DOM 界面交互
│   └── audio.js              ← Web Audio API 音效合成
└── style.css                 ← 全局样式（暗色主题）
```

---

## 代码规范

- 纯原生 JS，不引入任何框架或库（npm 仅用于工具链）
- 使用 ES6+ 语法：const/let、箭头函数、class、模块化
- 文件使用 `type="module"` 方式组织
- 函数命名：camelCase；类名：PascalCase；常量：UPPER_SNAKE_CASE
- 不使用 `var`，禁止全局变量污染
- 注释只写非显而易见的逻辑，不写废话注释

## 游戏规范

- Canvas 尺寸：600×600，格子大小：20px（30×30 网格）；HiDPI 自动适配（devicePixelRatio）
- 帧率目标：requestAnimationFrame 驱动，速度用计时器控制（初始 150ms/格，最低 50ms）
- 方向控制：WASD + 方向键 + 移动端滑动，禁止 180° 掉头；输入队列最多缓冲 2 个指令
- 食物：随机位置，不与蛇身重叠；呼吸动画（sin 波±10% 缩放）
- 计分：每吃一个食物 +10 分，每 5 个食物提升一个 Level，同步加速
- 最高分：localStorage 持久化，游戏结束时自动存档
- 特效：吃食物时扩散光环 + "+10" 浮字；死亡时红色径向渐变闪光
- 胜利条件：蛇填满整个 30×30 网格时触发 YOU WIN 界面

## 关键架构约定

- `game.js` 中所有特效通过 `this.effects[]` 统一管理，每帧 filter 清除过期项
- `renderer.js` 负责所有 Canvas 绘制，不持有游戏状态
- `ui.js` 只操作 DOM，通过 classList 切换 `overlay-hidden`，不写 inline style
- `snake.js` 的 `setDirection()` 校验基于 `_directionQueue` 末位，非 `direction` 当前值

## 禁止事项

- 不使用 `document.write()`
- 不使用 `eval()`
- 不内联 style（全部走 CSS class）
- 不直接操作 DOM 字符串拼接（用 createElement 或 template）
- 不在循环内部定义函数

---

## 常用命令

```bash
# 启动本地开发服务器（需要 python 或 node）
python -m http.server 8080
# 或
npx serve .
```

---

## Git 仓库

- Remote: `git@github.com:njueeRay/Hello-Snake-Game.git`
- Branch: `master`

## 当前阶段

- [x] Claude Code 配置工程（基础设施）
- [x] 游戏核心实现（蛇、食物、碰撞检测）
- [x] 渲染层（Canvas 绘制）
- [x] UI 层（分数、等级、最高分、开始/结束/胜利/暂停界面）
- [x] 动画增强（食物呼吸、吃食物特效、死亡闪光、+10浮字）
- [x] 移动端触摸支持（滑动控制 + 点击暂停）
- [x] HiDPI 适配（devicePixelRatio 缩放）
- [x] 最高分持久化（localStorage）
- [x] 音效（Web Audio API，oscillator 合成）
- [x] 难度选择（Easy / Normal / Hard）
- [x] 开源文档（README + LICENSE + CONTRIBUTING + Issue Templates）
- [x] GitHub Pages 自动部署（GitHub Actions）
- [x] 特殊食物类型（Golden +50分无增长8s失效 / Blue +20分速度debuff）
- [x] 障碍物模式（Level 3 开启，每升级 +2 块，上限 12，撞障碍物即死）
