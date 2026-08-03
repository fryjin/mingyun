# TEST REPORT

## 已执行

- 校验补丁只包含运行时文件：`index.html`、`sw.js`、`styles/midnight-game-hall.css`。
- 确认补丁不包含 `src/`、`data/` 或任何游戏插件文件。
- 校验 `sw.js` JavaScript 语法。
- 校验 `index.html` 内联模块脚本语法。
- 校验 CSS 花括号数量一致。
- 校验版本参数、BUILD 标识和 Service Worker 缓存键一致。

## 需要部署后真机确认

- iPhone Safari 360–430px 宽度下顶部栏是否稳定。
- 首页完整品牌头与游戏页紧凑品牌头切换是否自然。
- 游戏卡两列布局是否无文字重叠。
- 二选一、投票、倒计时、炸弹和转盘页面的颜色层级是否符合预期。
- 更新提示点击后是否加载 V9.2.3 样式。
