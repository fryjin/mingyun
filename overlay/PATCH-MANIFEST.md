# V10.5 架构收口补丁清单

## 基线

- Repository: `fryjin/mingyun`
- Base: `8a802fd2181630d9191a536e6f7cda23ba20d29f` (V10.4)
- Target: V10.5.0 architecture closeout

## 修改 / 新增

补丁包 `overlay/` 包含所有需要覆盖或新增的文本文件，包括版本标识、Registry、Vite、Service Worker、架构校验、CI/Pages workflow 和最终文档。

## 重命名

```text
styles/fate-wheel-v9.2.4.css -> styles/fate-wheel.css
styles/fate-stack-v9.3.6.css -> styles/fate-stack.css
styles/game-expansion-v9.3.css -> styles/game-expansion.css
styles/game-rules-v9.3.3.css -> styles/game-rules.css
```

仅更名，不改 CSS 内容。

## 删除

- `src/games/` 下 12 个 Legacy 游戏实现
- `src/games/shared.js`（活动上下文已迁入 `src/app/game-context.js`）
- `src/main.js` 与 `src/modules/games.js`
- 根目录 `app.js`、`app.css`、`manifest.json`
- `styles/fate-stack-v9.3.2.css`
- `styles/fate-stack-v9.3.3.css`
- `styles/fate-stack-v9.3.5.css`
- 四个已重命名的旧 CSS 路径

完整机器可读操作见补丁包 `OPERATIONS.json`。
