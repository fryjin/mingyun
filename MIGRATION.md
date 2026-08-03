# V9.1.2／V9.1.2.1 → V9.1.3 迁移说明

## 覆盖部署

1. 备份当前仓库。
2. 解压本升级包。
3. 将包内全部文件按原目录覆盖到仓库根目录。
4. **不要删除**包内未包含的旧题库、图标和其他游戏模块。
5. 等待 GitHub Pages 部署完成。
6. 手机端刷新两次；仍显示旧版时清除站点数据或注销旧 Service Worker。

## 新增文件

```text
styles/adult-plus.css
data/questions/adult-plus-truth.json
data/questions/adult-plus-dare.json
data/games/king-adult-plus.json
```

## 关键覆盖文件

```text
index.html
src/core/store.js
src/modules/questions.js
src/modules/game-sheet.js
src/games/shared.js
src/games/king.js
src/games/wheel.js
sw.js
data/questions/manifest.json
data/games/manifest.json
scripts/validate_project.py
```

`src/games/wheel.js` 包含 V9.1.2.1 的纯金属中心轴帽修正，因此本包可直接覆盖 V9.1.2 或 V9.1.2.1。

## 缓存版本

```text
party-game-v9.1.3
```

新数据不会加入首屏预缓存，仅在用户选择成人进阶并实际抽题时加载。
