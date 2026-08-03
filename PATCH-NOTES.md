# 今晚谁遭殃 V9.1.2.1

## 命运转盘微调

转盘中心采用方案 A：纯金属圆形轴帽。

### 修改前

```html
<div class="casino-spindle"><span>命</span></div>
```

### 修改后

```html
<div class="casino-spindle" aria-hidden="true"></div>
```

现有 `.casino-spindle` 样式已经包含金属渐变、高光、外圈、阴影和中心轴，因此不新增图片素材，也不修改 `styles/games.css`。

## 兼容性

- 基于 V9.1.2 制作。
- 不改变本地存储数据。
- 不改变 8 种玩法注册信息。
- 不改变 3500 道共享题库与 2500 条／组专用内容。
- 不改变命运转盘的结果概率和运动参数。
