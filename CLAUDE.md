# Project: Snake Game (贪吃蛇)

技术栈：HTML5 Canvas + Vanilla JavaScript + CSS3

---

## 项目结构

```
Snake/
├── CLAUDE.md                 ← 本文件，项目核心规范
├── .claude/                  ← Claude Code 配置
│   ├── settings.json         ← 权限控制
│   ├── agents/               ← 专项 AI 团队
│   └── commands/             ← 自定义斜杠命令
├── index.html                ← 游戏入口页面
├── src/
│   ├── game.js               ← 游戏核心逻辑
│   ├── snake.js              ← 蛇的实体与行为
│   ├── food.js               ← 食物生成逻辑
│   ├── renderer.js           ← Canvas 渲染层
│   └── ui.js                 ← 分数、界面交互
└── style.css                 ← 全局样式
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

- Canvas 尺寸：600×600，格子大小：20px（30×30 网格）
- 帧率目标：requestAnimationFrame 驱动，速度用计时器控制（初始 150ms/格）
- 方向控制：WASD + 方向键，禁止 180° 掉头
- 食物：随机位置，不与蛇身重叠
- 计分：每吃一个食物 +10 分，每 5 个食物移动速度提升

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
- [x] UI 层（分数、开始/结束界面）
- [ ] 音效与动画增强（可选）
