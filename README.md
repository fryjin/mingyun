# 今晚谁遭殃 v5

移动端优先的聚会小游戏，包含：

- 命运骰局：2–12 人任意人数轮流投骰，支持 3、5、7、9、11 等单数人数，以及“最大点数输 / 最小点数输”
- 俄罗斯转盘：加速、巡航、惯性减速、指针刻度反馈与临停回摆
- 108 道真心话 / 大冒险题库，分轻松、标准、大胆三级
- 自定义玩家名称、随机昵称、人数切换名称保留、无重复抽题、音效与设备触感
- PWA 安装、离线缓存、旧缓存自动清理、Navigation Preload
- `prefers-reduced-motion` 无障碍适配

## 运行方式

直接打开 `index.html` 可以游玩。PWA 安装与 Service Worker 离线能力需要通过 HTTP/HTTPS 访问，例如：

```bash
python -m http.server 8080
```

然后打开 `http://localhost:8080`。

## 实现原则

- 无框架、无第三方运行时依赖
- 主要动画只更新 `transform`，通过 `requestAnimationFrame()` 驱动
- 转盘在动画期间才启用 `will-change`
- CSS 与 JavaScript 使用正确的 preload 资源提示
- Service Worker 使用应用壳预缓存、导航预加载、导航网络优先和静态资源 stale-while-revalidate
