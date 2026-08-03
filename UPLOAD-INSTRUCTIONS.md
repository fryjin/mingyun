# V9.1 升级补丁手动上传说明

目标仓库：`fryjin/mingyun`

## 使用前提

当前仓库已经包含以下题库目录：

```text
data/questions/
├── manifest.json
├── light-truth.json
├── light-dare.json
├── standard-truth.json
├── standard-dare.json
├── bold-truth.json
├── bold-dare.json
├── adult-truth.json
└── adult-dare.json
```

本补丁不重复携带这 3500 道题，上传后会直接读取现有目录。

## 推荐上传方式

1. 先在 GitHub 仓库创建分支：`feature/v9-1-architecture`。
2. 在本地解压本 ZIP。
3. 打开解压后的 `party-game-v9.1-architecture-patch` 文件夹。
4. 将文件夹内的全部文件和目录拖入 GitHub 分支根目录。
5. GitHub 提示同名文件时，保留本补丁版本，完成覆盖。
6. 提交信息建议填写：

```text
feat: migrate V9.1 to modular application architecture
```

7. 等待 GitHub Pages 部署完成后，使用手机打开部署地址验收。

## 本次覆盖文件

```text
index.html
README.md
manifest.webmanifest
sw.js
.nojekyll
```

## 本次新增目录或文件

```text
src/main.js
src/modules/lobby.js
src/modules/players.js
src/modules/games.js
src/modules/questions.js
styles/app.css
styles/games.css
icons/icon.svg
QUESTION-BANK-SCHEMA.md
```

## 不需要删除的文件

以下内容可以继续保留，不影响正式应用：

```text
题库检查页.html
题库索引.csv
validation-report.json
scripts/validate_questions.py
data/questions/*
V9-信息架构与交互说明.md
```

## 部署后强制刷新

V9.1 更新了 Service Worker。GitHub Pages 部署完成后：

1. 先普通刷新一次。
2. 页面仍显示旧原型时，再刷新一次。
3. 仍未更新时，清除该站点缓存或删除旧 PWA 后重新打开。

## 验收清单

- 首页不再显示“本场推荐”。
- 首页不再显示分类筛选标签。
- 页面底部不再显示导航栏。
- 8 个游戏以两列卡片展示。
- 玩家名称最多 4 个字符。
- 玩家可“暂时离场 / 恢复加入”。
- 命运骰局可以完成一整轮并抽取惩罚。
- 命运转盘可以转动、停止、选中玩家并抽取惩罚。
- 成人档首次选择时显示会话级确认。
- 炸弹传递的短局、标准、长局均可切换。
- 其余 6 个新玩法显示“后续版本接入”，属于预期状态。
