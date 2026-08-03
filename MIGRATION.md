# V9.1 → V9.1.1 迁移说明

## 推荐操作

1. 备份当前 GitHub 仓库和线上可用版本。
2. 解压本补丁包。
3. 将补丁包目录内全部文件覆盖到仓库根目录。
4. 重点确认以下文件已更新：

```text
src/core/motion.js
src/main.js
src/games/would-rather.js
src/games/king.js
src/games/dice.js
src/games/wheel.js
src/games/undercover.js
src/games/hot-potato.js
styles/games.css
data/games/undercover-*.json
data/games/manifest.json
sw.js
```

5. 保留其余 V9.1 模块和 3500 道共享题库，并以补丁包版本为准。
6. 等待 GitHub Pages 部署完成。
7. 手机端刷新两次；若仍显示旧版，清除该站点数据或注销旧 Service Worker。

## 不建议只上传单个文件

本补丁同时修改插件、样式、词库 Manifest、缓存清单和校验脚本。只替换某个游戏文件可能造成旧缓存或数据摘要不一致。

## 缓存变化

Service Worker 缓存键：

```text
party-game-v9.1.1
```

新 Service Worker 激活后会删除旧缓存。游戏进行中不会主动强制刷新。

## Anime.js 加载策略

- 在线部署时，应用会预热 Anime.js V4 的 WAAPI 独立模块。
- 首次动画不会等待网络：模块尚未就绪时立即使用原生 WAAPI。
- 离线状态下自动使用原生 WAAPI，游戏流程不受影响。
- 转盘主体仍由 RAF 驱动，以保留连续角速度和刻度碰撞控制。

## 旧原型备份

V9 原型仍保留在：

```text
docs/prototype-v9/
```
