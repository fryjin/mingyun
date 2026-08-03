# V9.2 补丁手动上传说明

目标仓库：`fryjin/mingyun`

## 上传前提

仓库已经部署 V9.1，并存在：

```text
src/modules/games.js
data/questions/manifest.json
styles/games.css
sw.js
```

## 上传步骤

1. 下载并解压 `party-game-v9.2-game-plugins-patch.zip`。
2. 打开解压后的补丁文件夹。
3. 将文件夹内全部文件与目录拖入 GitHub 仓库根目录。
4. GitHub 提示同名文件时，使用本补丁版本覆盖。
5. 建议提交说明：

```text
feat: add V9.2 interactive party game plugins
```

6. 等待 GitHub Pages 完成部署。
7. 手机端刷新两次；仍显示 V9.1 时，清除该站点缓存后重新打开。

## 关键检查

上传完成后仓库应存在：

```text
src/modules/game-content.js
src/games/most-likely.js
src/games/would-rather.js
src/games/five-second.js
src/games/hot-potato.js
data/games/manifest.json
```

大厅中以下六种模式应不再显示“待接入”：

- 命运骰局
- 命运转盘
- 谁最可能
- 二选一
- 五秒挑战
- 炸弹传递

国王游戏和谁是卧底仍显示“待接入”，这是本版预期状态。

## 不要删除

继续保留原仓库中的：

```text
data/questions/
题库索引.csv
validation-report.json
scripts/validate_questions.py
```
