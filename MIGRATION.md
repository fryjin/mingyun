# V9.1.1 → V9.1.2 迁移说明

## 推荐操作

1. 备份当前 GitHub 仓库和线上可用版本。
2. 解压本补丁包。
3. 将补丁包目录内全部文件覆盖到仓库根目录。
4. 等待 GitHub Pages 部署完成。
5. 手机端刷新两次；若仍显示旧版，清除该站点数据或注销旧 Service Worker。

## 重点更新文件

```text
src/core/store.js
src/modules/game-sheet.js
src/games/would-rather.js
src/games/wheel.js
styles/games.css
data/games/would-rather-*.json
data/games/undercover-*.json
data/games/manifest.json
scripts/validate_project.py
README.md
CHANGELOG.md
TEST-REPORT.md
sw.js
```

## 不建议只替换单个文件

本补丁同时修改路由状态、游戏插件、样式、专用题库、Manifest 摘要和 Service Worker 缓存键。只替换一个游戏文件可能造成数据摘要不一致或继续命中旧缓存。

## 缓存变化

Service Worker 缓存键：

```text
party-game-v9.1.2
```

新 Service Worker 激活后会删除旧缓存。游戏进行中不会主动强制刷新。

## 数据兼容

- 玩家名单、暂离状态和原有游戏设置继续使用 `party-game-v9.1` 本地存储键，不会因补丁升级被清空。
- 二选一数据增加 `question` 字段，旧版游戏插件不应继续配合新版数据单独使用。
- 谁是卧底 ID 和各档数量保持不变，但词组正文已经重整。

## 旧原型备份

V9 原型仍保留在：

```text
docs/prototype-v9/
```
