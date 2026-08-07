# V10 技术架构

## 目标

V10 将项目从“多个独立小游戏模块”升级为“派对游戏引擎”。V10.4 完成后，所有 12 个运行中的游戏均使用 V10 合约，Legacy 文件只保留作为回滚参考。

## 分层

```text
src/app            应用启动、路由协调、PWA 更新
src/engine         游戏运行时、生命周期、状态机、回合、计时、帧循环、随机、惩罚、页面可见性
src/data-engine    题库与通用 JSON 内容访问
src/components     游戏共用 UI 模板
src/motion         动画统一入口与 Web Animations 生命周期托管
src/games-v10      全部运行中的 V10 游戏插件
src/games          注册中心与 Legacy 回滚文件
```

## 插件合约

所有运行中的游戏通过 `createGamePlugin()` 创建，`contractVersion` 为 2。`src/games/index.js` 已不再导入任何 Legacy 游戏实现。

## 生命周期与重型交互

`GameRuntime` 保证同一时间只挂载一个游戏，`LifecycleScope` 统一清理事件和异步资源。

V10.4 新增：

- `FrameLoop`：生命周期托管的 `requestAnimationFrame` 循环，提供 delta 限幅与统一停止。
- `AnimationRegistry`：集中跟踪 Web Animations，游戏退出时自动取消仍在运行的动画。

命运叠塔使用：

```text
index.js      编排、输入、声音、震动、惩罚
physics.js    固定尺寸方块、最低重叠、累积重心、危险状态
session.js    玩家顺序、塔数据、移动块和状态机
view.js       HTML 与塔 DOM
camera.js     动态镜头缩放与位移
```

物理模型仍然是确定性的 1D 静态重心模型，不引入刚体物理库。

## 数据兼容

`QuestionEngine` 继续适配现有题库 JSON。成人边界筛选、游戏业务筛选及 `poolKeySuffix` 机制保持不变。

## 已迁移游戏

- 二选一
- 国王游戏
- 混乱法则
- 两个真相一个谎言
- 命运叠塔
- 命运骰局
- 命运转盘
- 谁是卧底
- 谁最可能
- 我居然做过
- 五秒挑战
- 炸弹传递

## Legacy 状态

V10.4 后，运行入口中的 Legacy 游戏数量为 0。

旧 `src/games/*.js` 游戏文件暂时不删除，用于最后一轮稳定验证和紧急回滚。静态样式 `styles/fate-stack-v9.3.6.css` 继续作为已经验证过的命运叠塔视觉资产使用，本轮不进行视觉改版或样式重命名。

## 下一阶段

V10.5 架构收口：

- 删除稳定迁移游戏的 Legacy 文件
- 收敛 `src/games/shared.js`
- 清理无引用的旧资源
- 完成 Vite 生产构建
- 补齐 CI / GitHub Pages 正式部署链路
- 统一版本化静态资源命名
