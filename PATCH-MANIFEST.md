# V9.2 功能补丁清单

## 目标

在已经部署 V9.1 的仓库上新增四种正式可玩模式：

1. 谁最可能
2. 二选一
3. 五秒挑战（3–60 秒自由设置）
4. 炸弹传递

## 覆盖文件

```text
index.html
README.md
src/main.js
src/modules/games.js
styles/games.css
sw.js
```

## 新增文件

```text
src/modules/game-content.js
src/games/shared.js
src/games/most-likely.js
src/games/would-rather.js
src/games/five-second.js
src/games/hot-potato.js
GAME-CONTENT-SCHEMA.md
data/games/manifest.json
data/games/most-likely/*.json
data/games/would-rather/*.json
data/games/five-second/*.json
data/games/hot-potato/*.json
```

## 不包含

本补丁不重复携带：

- `data/questions/` 下的 3500 道共享惩罚题库
- 未修改的玩家系统、大厅模块、通用样式和图标
- 国王游戏与谁是卧底的正式逻辑
