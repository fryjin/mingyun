# V9.4 谁是卧底补丁清单

## 迁移目标

在已部署的 V9.3 基础上正式接入“谁是卧底”，使游戏大厅中的 8 种玩法全部可运行。

## 覆盖文件

```text
index.html
README.md
GAME-CONTENT-SCHEMA.md
sw.js
src/modules/games.js
styles/games.css
data/games/manifest.json
```

## 新增文件

```text
src/games/undercover.js
data/games/undercover/light.json
data/games/undercover/standard.json
data/games/undercover/hard.json
```

## 新增能力

- 完整的秘密看词与手机交接流程。
- 1–3 位隐藏阵营，按玩家人数自动限额。
- 可选空白牌。
- 轻松、标准、烧脑三档词库。
- 随机发言顺序。
- 逐人秘密投票，禁止自投。
- 平票加赛与再次平票随机决胜。
- 淘汰身份揭晓与自动胜负判断。
- 最后一位隐藏玩家猜词翻盘。
- 后台切换自动隐藏词语和投票页面。
- 240 组专用词库。

## 版本变化

- 可玩模式：7 → 8。
- `data/games/` 专用内容：408 → 648。
- Service Worker：`mingyun-v9.4-*`。
