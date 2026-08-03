# V9.1.4 升级说明

## 适用基础版本

- V9.1.2
- V9.1.2.1
- V9.1.3

本包已累计包含 V9.1.3 成人进阶基础能力和命运转盘纯金属中心轴帽修正。

## 操作步骤

1. 备份当前 GitHub 仓库。
2. 解压升级包。
3. 将包内全部文件按目录结构覆盖到仓库根目录。
4. 不要删除升级包未包含的旧题库和图标文件。
5. 等待 GitHub Pages 部署完成。
6. 手机端刷新两次；若仍为旧版，清除该站点缓存或注销旧 Service Worker。

## 重点新增文件

```text
styles/ui-refresh.css
data/games/most-likely-adult-plus.json
data/games/would-rather-adult-plus.json
data/games/five-second-adult-plus.json
data/games/undercover-adult-plus.json
docs/UI-SKILL-REVIEW.md
docs/UI-UX-DECISIONS.md
```

## 重点覆盖文件

```text
index.html
sw.js
styles/adult-plus.css
src/main.js
src/modules/overlay.js
src/modules/lobby.js
src/modules/players.js
src/modules/game-sheet.js
src/modules/settings.js
src/games/most-likely.js
src/games/would-rather.js
src/games/five-second.js
src/games/hot-potato.js
src/games/undercover.js
data/games/manifest.json
data/questions/manifest.json
scripts/validate_project.py
```

## 缓存变化

```text
party-game-v9.1.4
```

新 Service Worker 激活后会清理旧缓存。专用成人进阶题库仍采用首次使用后运行时缓存，不加入首屏预缓存。
