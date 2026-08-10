# V10 技术架构基线（V10.5）

## 状态

V10.5 完成架构收口。12 个运行中的游戏全部使用 V10 contract v2，运行时不再保留 Legacy 游戏实现或 Legacy 注册通道。

## 分层

```text
src/app            应用启动、路由协调、游戏上下文/惩罚桥接、PWA 更新
src/engine         生命周期、运行时、状态机、回合、计时、帧循环、随机、惩罚、可见性
src/data-engine    通用 JSON 内容与题库访问
src/components     游戏共用 UI
src/motion         动画入口与动画生命周期
src/games-v10      12 个正式运行游戏插件
src/games          仅保留入口 index.js 与 registry.js
styles             稳定命名的运行样式
```

## 插件约束

- 正式插件必须使用 `createGamePlugin()` 创建。
- Registry 只接受 `contractVersion = 2`。
- Registry 不再接受 `source = legacy`。
- `src/games/index.js` 只允许导入 `src/games-v10/*/index.js`。
- V10.5 架构校验脚本会阻止 Legacy 文件或旧样式命名重新进入运行时。

## 重型交互

命运叠塔仍保持 V10.4 已验证实现：`physics / session / view / camera` 分层，RAF 使用 `FrameLoop`，Web Animations 使用 `AnimationRegistry`，后台恢复使用统一 Visibility 生命周期。V10.5 不修改任何叠塔参数或判定。

## 构建

生产构建以 Vite 为唯一正式构建链路：

```text
npm run verify
  ├─ syntax / JSON check
  ├─ V10.5 architecture check
  ├─ node tests
  └─ vite build -> dist/
```

Vite 使用相对 `base: './'`，用于兼容 GitHub Pages 项目子路径。生产 Service Worker 在构建阶段生成，版本为 `party-game-v10.5.0-vite`。

## 部署

- `.github/workflows/ci.yml`：main / PR 验证。
- `.github/workflows/pages.yml`：main 构建并部署 `dist/` 到 GitHub Pages。
- 仓库 Pages 发布源需设置为 **GitHub Actions**。

## 历史文件策略

V9 prototype 和历史测试截图继续保留在 docs / prototype 目录作为项目档案，但不进入生产构建、Service Worker 或运行入口。
