# 玩法专用内容结构 V9.4

## 当前内容总量

- 谁最可能：72 条
- 二选一：72 条
- 五秒挑战：72 条
- 炸弹传递：72 条
- 国王游戏：120 条
- 谁是卧底：240 组
- 总计：648 条 / 组

## 谁是卧底数据包

目录：

```text
data/games/undercover/
├── light.json
├── standard.json
└── hard.json
```

数据包结构：

```json
{
  "schemaVersion": "1.0.0",
  "bankVersion": "v9.4-undercover-2026.08",
  "gameId": "undercover",
  "level": 2,
  "levelLabel": "标准",
  "count": 80,
  "items": []
}
```

单组词结构：

```json
{
  "id": "undercover-standard-001",
  "gameId": "undercover",
  "level": 2,
  "civilianWord": "拿铁",
  "undercoverWord": "卡布奇诺",
  "category": "生活方式",
  "source": "v9.4"
}
```

## 运行规则

- `spyCount` 表示隐藏阵营总人数。
- 开启空白牌后，隐藏阵营中 1 人获得空白词，其余隐藏玩家获得卧底词。
- 平民获得 `civilianWord`，普通卧底获得 `undercoverWord`。
- 空白牌玩家不显示任何词语。
- 轻松、标准、烧脑分别对应 level 1、2、3。
- 谁是卧底不使用成人档，也不复用共享惩罚题库。

## 加载与缓存

- 进入谁是卧底后，根据词库难度加载单个 JSON。
- `GameContentLoader` 会排除最近 12 组内容。
- 首次使用后由 Service Worker 运行时缓存。
- `data/games/manifest.json` 记录数量、字节数和 SHA-256。
