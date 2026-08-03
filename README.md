# 今晚谁遭殃 V9.1

移动端优先、单手机多人共玩的派对游戏集合。本版本完成从单文件 V9 UX 原型到正式模块化应用架构的迁移。

## V9.1 架构

```text
index.html
├── src/main.js                 应用编排与生命周期
├── src/modules/lobby.js        游戏大厅
├── src/modules/players.js      玩家系统与派对房间状态
├── src/modules/games.js        游戏插件注册、详情抽屉与游戏舞台
├── src/modules/questions.js    题库清单、按需加载与随机抽取
├── styles/app.css              大厅、玩家管理与通用组件
├── styles/games.css            游戏舞台与结果弹层
├── data/questions/             3500 道共享惩罚题库
├── manifest.webmanifest
└── sw.js
```

## 本版已完成

### 游戏大厅

- 删除推荐游戏卡片。
- 删除分类筛选标签。
- 删除底部导航。
- 8 个游戏按中文拼音 A–Z 排序。
- 两列卡片适配 360px 宽度。
- 卡片描述限制两行，统一文字间距。

### 玩家系统

- 支持 2–12 人及全部单数人数。
- 玩家名称限制为最多 4 个字符。
- 支持自定义名称与随机昵称。
- 支持“暂时离场 / 恢复加入”。
- 不提供拖动排序。
- 所有游戏只读取当前在场玩家。
- 玩家状态持久化到 localStorage。

### 游戏插件

已经正式迁移并可玩：

- 命运骰局
- 命运转盘

已完成插件注册和设置抽屉，玩法逻辑将在后续版本接入：

- 谁最可能
- 二选一
- 五秒挑战
- 炸弹传递
- 谁是卧底
- 国王游戏

炸弹传递抽屉已修正：

- 短局：30–60 秒
- 标准：60–120 秒
- 长局：120–180 秒
- 三档均可点击选择
- 不再在右上角显示内部随机区间

### 题库加载器

共享惩罚题库总量为 3500 道：

| 档位 | 真心话 | 大冒险 | 合计 |
|---|---:|---:|---:|
| 轻松 | 250 | 250 | 500 |
| 标准 | 250 | 250 | 500 |
| 大胆 | 250 | 250 | 500 |
| 成人刺激 | 1000 | 1000 | 2000 |

题库不会在首屏全部加载。进入结果阶段后，只请求当前档位与题型对应的 JSON 文件。

成人档只在用户选择 18+ 时进行一次会话级确认，不会在开始游戏后增加独立页面。

## PWA 缓存

- 应用壳在安装时预缓存。
- 题库数据不进入首屏预缓存。
- 首次使用某个题库后，由 Service Worker 使用 stale-while-revalidate 策略缓存。
- 导航请求使用 network-first，并以 `index.html` 作为离线回退。

## 本地运行

ES Module、题库请求和 Service Worker 需要通过 HTTP/HTTPS 运行：

```bash
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 校验

```bash
python scripts/validate_questions.py

node --check src/main.js
node --check src/modules/lobby.js
node --check src/modules/players.js
node --check src/modules/games.js
node --check src/modules/questions.js
node --check sw.js
```

## 后续版本

- V9.2：谁最可能、二选一、五秒挑战、炸弹传递。
- V9.3：国王游戏。
- V9.4：谁是卧底。
