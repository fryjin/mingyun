# 题库数据结构

每个数据文件使用相同结构：

```json
{
  "schemaVersion": "1.0.0",
  "bankVersion": "v9-qb-2026.08",
  "level": 1,
  "levelLabel": "轻松",
  "type": "truth",
  "count": 250,
  "items": []
}
```

单题字段：

```json
{
  "id": "v9-t1-0001",
  "type": "truth",
  "level": 1,
  "text": "……",
  "theme": "日常偏好",
  "tags": ["light", "truth", "轻松"],
  "consentRequired": false,
  "source": "v9-expansion"
}
```

- `id`：稳定唯一标识，不应用数组下标代替。
- `level`：1 轻松、2 标准、3 大胆、4 成人刺激。
- `consentRequired`：涉及指定其他玩家、眼神互动、双人演绎等任务时为 `true`。
- `source`：`v8` 表示保留的原题；`v9-expansion` 表示本轮新增题。
