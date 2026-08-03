# V9.2.0 Midnight Game Hall 升级补丁

本补丁在 V9.1.4 / V9.1.3 已部署项目基础上，完成一轮整体视觉语言重构。

## 本轮重点

- 整体品牌风格升级为 **Midnight Game Hall（午夜游戏厅）**
- 大厅、玩家管理、设置抽屉、游戏详情抽屉统一为同一套暗夜俱乐部视觉系统
- 新增 5 个可复用 SVG 组件素材，用于品牌、装饰边框、舞台背景与星点纹理
- 命运转盘由原赌场语义，重构为更通用的 **幸运轮盘房** 表达
- 炸弹时长延续上一版设定：短 10–20 秒 / 中 20–40 秒 / 长 40–60 秒
- 保持成人进阶对全部游戏模式开放
- Service Worker 升级到 `party-game-v9.2.0`

## 新增可复用素材

- `assets/midnight/brand-crest.svg` 品牌徽章
- `assets/midnight/divider.svg` 分隔饰条
- `assets/midnight/corner-flourish.svg` 卡片角饰
- `assets/midnight/stage-arch.svg` 舞台拱形背景
- `assets/midnight/starfield.svg` 夜空纹理

## 适用版本

推荐覆盖以下任一已部署版本：

- V9.1.4
- V9.1.3
- V9.1.2.1（若已经具备 V9.1.4 的完整目录结构）

## 使用方式

1. 先备份当前仓库。
2. 解压本补丁包。
3. 将补丁内文件按原路径覆盖到仓库根目录。
4. 提交并等待 GitHub Pages 重新部署。
5. 手机端若仍显示旧样式，请刷新两次，必要时清除旧 Service Worker 缓存。
