# 今晚谁遭殃 / Midnight Game Hall

单手机多人派对游戏合集，当前工程基线：**V10.5.0**。

## 当前架构

- 12 / 12 游戏均使用 V10 contract v2。
- `src/games/` 仅保留插件入口与 Registry。
- Legacy 游戏实现已退出仓库运行层。
- Vite 是正式生产构建链路。
- GitHub Actions 执行 CI 与 GitHub Pages 部署。
- PWA Service Worker 在生产构建阶段生成。

## 开发

```bash
npm install
npm run dev
```

## 完整验证

```bash
npm run verify
```

## 生产构建

```bash
npm run build
```

产物输出到 `dist/`。

详细架构、迁移、部署与回滚说明见 `docs/ARCHITECTURE-V10.md`、`docs/MIGRATION-V10.md`、`docs/DEPLOYMENT-V10.md`、`docs/ROLLBACK-V10.md`。
