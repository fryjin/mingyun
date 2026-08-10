# V10.5 PATCH NOTES

V10.5 是 V10 架构迁移的收口版本，不新增玩法。

关键变化：

- 运行时 Legacy = 0，仓库运行层 Legacy = 0。
- Registry contract v1 兼容入口关闭。
- 稳定 CSS 名称替代 V9 版本号文件名。
- 正式构建切换为 Vite `dist/`。
- CI 和 GitHub Pages 发布链路落地。
- 新增 `check:architecture`，防止旧文件、旧样式、Legacy 注册方式回流。

若 V10.5 出现工程级问题，整体回滚 V10.4，不单独恢复 Legacy 游戏。
