# MIGRATION

## 覆盖路径

请将以下文件覆盖到线上项目对应路径：

- `index.html`
- `sw.js`
- `styles/midnight-game-hall.css`
- `src/modules/lobby.js`
- `src/modules/players.js`
- `src/modules/settings.js`
- `src/modules/game-sheet.js`
- `src/games/shared.js`
- `src/games/wheel.js`
- `assets/midnight/*.svg`

## 部署后检查项

### 首页
- 品牌头部是否显示新的徽章与副标题
- 游戏卡片是否为两列，且各卡片显示“游戏房间”标签
- 房间摘要卡是否显示新的拱形背景与夜空纹理

### 玩家页
- 2–12 人按钮是否正常
- 玩家名称输入、暂离、恢复、随机昵称与保存功能是否正常

### 游戏详情抽屉
- 新的主题样式是否生效
- 成人进阶边界面板是否显示正常

### 游戏舞台
- 标题区是否为 Midnight Game Hall 风格
- 命运转盘是否正常可转动，结果揭晓与惩罚流程不受影响

### 缓存
- 若样式未更新，确认 Service Worker 版本是否已切换到 `party-game-v9.2.0`
