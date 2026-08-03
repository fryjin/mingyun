# TEST REPORT

## 已执行

- `node --check` 校验以下脚本语法：
  - `src/modules/lobby.js`
  - `src/modules/players.js`
  - `src/modules/settings.js`
  - `src/modules/game-sheet.js`
  - `src/games/shared.js`
  - `src/games/wheel.js`
- 检查 `sw.js` 版本号已更新为 `party-game-v9.2.0`
- 检查 `index.html` 已引入 `styles/midnight-game-hall.css`
- 检查 5 个 SVG 资源已纳入缓存清单
- 检查炸弹时长仍为短 10–20 / 中 20–40 / 长 40–60 秒

## 未执行

- 未执行真实浏览器自动化截图回归
- 未执行完整移动端手工交互回归

## 建议上线后重点验收

- 360px / 390px / 430px 下的大厅与抽屉排版
- PWA 离线缓存刷新是否正常
- 命运转盘动画在移动端是否流畅
- 私密传递、成人进阶、惩罚弹层流程是否完整
