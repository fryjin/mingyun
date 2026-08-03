# V9.3 国王游戏补丁清单

## 迁移目标

在已部署的 V9.2 基础上正式接入“国王游戏”，不重复携带现有 3500 道共享惩罚题库，也不重复携带 V9.2 四种玩法的 288 条 JSON 内容。

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
src/games/king.js
data/games/king/light.json
data/games/king/standard.json
data/games/king/bold.json
data/games/king/adult.json
```

## 新增能力

- 国王游戏由“待接入”改为正式可玩。
- 3–12 位在场玩家。
- 每轮随机分配一位国王与唯一号码。
- 防偷看的逐人交接与身份查看流程。
- 页面切到后台时自动隐藏当前身份。
- 随机题库和国王自定两种模式。
- 国王自定支持 1 人或 2 人目标。
- 号码揭晓后显示真实玩家。
- 每轮结束重新洗牌并重新选出国王。
- 四档专用指令共 120 条。
- 成人档继续沿用现有 18+ 会话确认。

## 版本变化

- 可玩模式：6 → 7。
- `data/games/` 专用内容：288 → 408。
- Service Worker：`mingyun-v9.3-*`。
