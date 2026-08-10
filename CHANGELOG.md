# CHANGELOG

## V10.5.0 — 架构收口

### 运行架构

- 将活动游戏上下文/惩罚桥接迁到 `src/app/game-context.js`，删除 12 个 Legacy 游戏实现和 `src/games/shared.js`。
- Registry 只接受 V10 contract v2，停止 Legacy source。
- `src/games/` 收口为运行入口与 Registry。

### 静态资源

- 活跃 V9 命名样式改为稳定文件名，不修改视觉内容。
- 删除被替代的命运叠塔旧版本样式。
- 删除旧 `src/main.js`、`src/modules/games.js`、根目录 `app.js` / `app.css` 与重复 `manifest.json`。

### 构建与部署

- 应用、Build、静态 SW 与 Vite SW 统一到 V10.5.0。
- Vite 正式输出 `dist/`。
- 新增架构校验脚本。
- 新增 GitHub Actions CI。
- 新增 GitHub Pages 构建部署工作流。

### 兼容性

- 不修改任何游戏规则、题库、玩家设置或命运叠塔 V10.4 物理参数。
