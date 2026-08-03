# 玩法专用内容结构 V9.3

## 清单文件

`data/games/manifest.json` 记录每个游戏、档位、题目数量、文件大小和 SHA-256。

V9.3 当前包含：

- 谁最可能：72 条
- 二选一：72 条
- 五秒挑战：72 条
- 炸弹传递：72 条
- 国王游戏：120 条
- 总计：408 条

## 国王游戏数据结构

```json
{
  "schemaVersion": "1.0.0",
  "bankVersion": "v9.3-king-2026.08",
  "gameId": "king",
  "level": 2,
  "levelLabel": "标准",
  "count": 30,
  "items": []
}
```

单条指令：

```json
{
  "id": "king-standard-001",
  "gameId": "king",
  "level": 2,
  "targetCount": 2,
  "text": "{a}和{b}进行十五秒即兴采访，一人记者一人嘉宾。",
  "consentRequired": false,
  "source": "v9.3"
}
```

字段说明：

- `targetCount`：系统需要随机抽取的号码数量，目前为 1 或 2。
- `{a}`：第一个目标号码，运行时替换成“X号”。
- `{b}`：第二个目标号码，仅在 `targetCount = 2` 时使用。
- `consentRequired`：涉及眼神、距离、双人互动或成人边界时为 `true`。
- `source`：本轮新增内容统一标记为 `v9.3`。

## 加载策略

- 进入国王游戏后不立即加载指令。
- 所有玩家完成身份查看、国王确认接管手机后，才加载当前档位 JSON。
- 换题从已加载题库中抽取，并排除最近 12 条。
- 成人档仅在完成会话级 18+ 确认后加载。
