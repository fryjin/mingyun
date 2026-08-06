# V10 技术架构

## 目标

V10 将项目从“多个独立小游戏模块”升级为“可渐进迁移的派对游戏引擎”。当前版本采用兼容式双轨架构：V9 插件继续运行，新插件使用 V10 合约和基础服务。

## 分层

```text
src/app            应用启动、路由协调、PWA 更新
src/engine         游戏运行时、生命周期、回合、计时、随机、惩罚
src/data-engine    题库与通用 JSON 内容访问
src/components     游戏共用 UI 模板
src/motion         动画统一入口
src/games-v10      V10 游戏插件
src/games          V9 游戏与兼容注册中心
```

## 插件合约

V10 插件通过 `createGamePlugin()` 创建，`contractVersion` 为 2。注册中心继续支持原有 `registerGame(plugin)`，同时记录插件来源和合约版本。

## 生命周期

`GameRuntime` 负责：

- 同一时间只挂载一个游戏；
- 创建并销毁游戏上下文；
- 统一清理定时器、事件和动画；
- 捕获插件异常并回退到可返回大厅的错误页面。

## 数据兼容

V10 `QuestionEngine` 先适配现有题库模块，不改变 JSON 文件和抽题逻辑。通用 `ContentRepository` 为后续卡牌、规则、配置和题库统一读取提供基础。

## 首批迁移

- 命运骰局：使用 V10 回合、随机、生命周期、惩罚服务和 UI 组件。
- 谁最可能：使用 V10 回合、题库、随机、惩罚服务和拆分视图。

## 构建与部署

项目仍可直接作为原生 ES Module 站点运行。新增 Vite 构建与 GitHub Pages Actions 流程，用于正式生产构建、资源压缩和自动校验。
