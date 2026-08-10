# V10 迁移计划

## 当前进度

- V10.0 基础架构：已完成
- V10.1 简单游戏：已完成
- V10.2 中等复杂度：已完成
- V10.3 状态复杂型：已完成
- V10.4 命运叠塔重型交互：已完成
- V10.5 架构收口：已完成

## V10.5 收口内容

1. 删除 12 个 `src/games/*.js` Legacy 游戏实现。
2. 将仍在使用的 `createGameContext` / 惩罚桥接迁入 `src/app/game-context.js`，再删除 `src/games/shared.js`。
3. Registry 停止接受 contract v1 / legacy source。
4. 删除旧入口 `src/main.js`、旧模块注册器 `src/modules/games.js`、根目录 `app.js` / `app.css` 与重复 `manifest.json`。
5. 活跃游戏样式改为稳定文件名：`fate-wheel.css`、`fate-stack.css`、`game-expansion.css`、`game-rules.css`。
6. 删除已被替代的命运叠塔 V9.3.2 / V9.3.3 / V9.3.5 样式。
7. 统一应用版本、Build、静态 SW 与 Vite SW 到 10.5.0。
8. 增加 V10.5 架构校验，阻止 Legacy 回流。
9. 建立 CI 与 GitHub Pages `dist/` 部署工作流。
10. 更新项目 README、CHANGELOG、部署说明、补丁清单与回滚策略。

## 不修改

- 12 个游戏的用户可见玩法规则
- 题库内容和成人边界
- 玩家设置字段
- 命运叠塔 V10.4 物理参数、重心算法、镜头和反馈
- 已稳定的视觉布局与交互层级

## 后续版本

V10 系列架构迁移到此结束。后续功能版本应直接在 V10 contract v2 和 Vite/CI 基线上迭代，不再恢复双轨架构。
