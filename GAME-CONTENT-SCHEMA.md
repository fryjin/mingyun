# V9.2 专用玩法题库结构

## 清单

`data/games/manifest.json` 记录所有数据包：

```json
{
  "file": "data/games/most-likely/light.json",
  "gameId": "most-likely",
  "level": 1,
  "count": 18,
  "sha256": "...",
  "bytes": 0
}
```

## 普通题目结构

适用于谁最可能、五秒挑战和炸弹传递：

```json
{
  "id": "v92-most-likely-light-001",
  "text": "谁最可能出门前找不到自己的手机？"
}
```

## 二选一结构

```json
{
  "id": "v92-would-rather-light-001",
  "optionA": "永远只能吃甜食",
  "optionB": "永远只能吃咸食"
}
```

## 档位

- `1 / light`：轻松
- `2 / standard`：标准
- `3 / bold`：大胆
- `4 / adult`：成人刺激，仅限成年人自愿开启

稳定 ID 不应使用数组下标替代。更新题目正文时保留 ID；删除题目后不要复用旧 ID。
