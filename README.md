# 今晚谁遭殃 V9.2

移动端优先、单手机多人共玩的派对游戏集合。V9.2 在 V9.1 模块化架构上正式接入四种新玩法，并保留 3500 道共享真心话 / 大冒险惩罚题库。

## 当前可玩模式

| 游戏 | 状态 | 人数 |
|---|---|---:|
| 命运骰局 | 可玩 | 2–12 |
| 命运转盘 | 可玩 | 2–12 |
| 谁最可能 | V9.2 新增 | 3–12 |
| 二选一 | V9.2 新增 | 2–12 |
| 五秒挑战 | V9.2 新增，3–60 秒自由设置 | 2–12 |
| 炸弹传递 | V9.2 新增 | 3–12 |
| 国王游戏 | 待 V9.3 | 3–12 |
| 谁是卧底 | 待 V9.4 | 4–12 |

## V9.2 新玩法

### 谁最可能

- 展示专用题目。
- 全员同时指向玩家。
- 主持人登记每位玩家票数。
- 支持并列随机一人或并列全部接受惩罚。
- 结算后接入共享惩罚题库。

### 二选一

- 玩家依次选择 A 或 B。
- 支持少数派、多数派、随机解释三种结算方式。
- 显示双方人数和玩家名单。
- 少数派为空或双方平票时自动改为全员随机，避免无可选玩家。

### 五秒挑战

- 名称保留“五秒挑战”，实际支持 3–60 秒自由设置。
- 提供 5、10、15、30 秒快捷预设。
- requestAnimationFrame 驱动倒计时圆环。
- 时间结束后由其他玩家判断成功或失败。
- 失败玩家进入共享惩罚系统。

### 炸弹传递

- 短局：30–60 秒。
- 标准：60–120 秒。
- 长局：120–180 秒。
- 支持顺时针、逆时针和随机方向。
- 不显示精确剩余时间。
- 每次传递自动更换任务。
- 引爆时锁定当前持有者并进入惩罚系统。
- 页面明确提示只传递手机，不得抛掷。

## 专用玩法题库

V9.2 新增首批 288 条专用内容：

| 游戏 | 轻松 | 标准 | 大胆 | 成人 | 合计 |
|---|---:|---:|---:|---:|---:|
| 谁最可能 | 18 | 18 | 18 | 18 | 72 |
| 二选一 | 18 | 18 | 18 | 18 | 72 |
| 五秒挑战 | 18 | 18 | 18 | 18 | 72 |
| 炸弹传递 | 18 | 18 | 18 | 18 | 72 |
| **合计** | **72** | **72** | **72** | **72** | **288** |

这些内容位于 `data/games/`，根据游戏与内容尺度按需加载，不进入首屏预缓存。成人档仍沿用会话级 18+ 与自愿确认。

原有 3500 道共享惩罚题库继续位于 `data/questions/`，只在出现惩罚结果时按档位与题型加载。

## 代码结构

```text
index.html
├── src/main.js
├── src/modules/
│   ├── lobby.js
│   ├── players.js
│   ├── games.js
│   ├── questions.js
│   └── game-content.js
├── src/games/
│   ├── shared.js
│   ├── most-likely.js
│   ├── would-rather.js
│   ├── five-second.js
│   └── hot-potato.js
├── data/questions/          3500 道共享惩罚题库
├── data/games/              288 条 V9.2 专用内容
├── styles/
│   ├── app.css
│   └── games.css
└── sw.js
```

## PWA 缓存

- 应用壳、玩法模块和玩法清单在安装阶段预缓存。
- 具体专用题库在首次进入相应游戏后按需缓存。
- 3500 道共享惩罚题库继续按使用情况缓存。
- Service Worker 缓存版本升级为 `mingyun-v9.2-*`。

## 本地运行

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。ES Module、JSON 题库和 Service Worker 不应通过双击 HTML 的方式测试。

## 校验

```bash
node --check src/main.js
node --check src/modules/games.js
node --check src/modules/game-content.js
node --check src/games/most-likely.js
node --check src/games/would-rather.js
node --check src/games/five-second.js
node --check src/games/hot-potato.js
node --check sw.js
```
