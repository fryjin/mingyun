# V10.5 构建与部署

## 本地验证

```bash
npm install
npm run verify
```

`verify` 会依次执行语法/JSON 校验、V10.5 架构校验、测试和 Vite 生产构建。

## 生产产物

正式发布目录为：

```text
dist/
```

不要再把源码根目录作为正式 Pages 发布产物。

## GitHub Pages

仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。

`pages.yml` 在 main 更新后：

1. 安装依赖；
2. 运行静态检查、架构检查和测试；
3. 执行 Vite build；
4. 上传 `dist/`；
5. 部署到 `github-pages` environment。

## PWA

Vite 构建阶段生成 `dist/sw.js`。缓存版本随 V10.5 升级，旧 `party-game-*` 缓存会在 activate 阶段清理。
