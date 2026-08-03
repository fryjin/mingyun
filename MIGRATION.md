# V9 → V9.1 迁移说明

## 推荐操作

1. 下载并备份当前 GitHub 仓库。
2. 保留现有 `data/questions/`，但以补丁包中的版本为准覆盖。
3. 删除旧的单文件原型 `index.html` 和旧版根目录脚本、样式。
4. 将本补丁包全部文件上传到仓库根目录。
5. 确认以下目录完整存在：

```text
src/
styles/
data/questions/
data/games/
icons/
scripts/
```

6. 等待 GitHub Pages 部署完成。
7. 手机端刷新两次；若仍显示旧版本，清除浏览器站点数据或注销旧 Service Worker。

## 建议备份位置

旧 V9 原型已包含在：

```text
docs/prototype-v9/
```

## 建议删除的旧文件

如果仓库中仍存在以下 V8 单体文件，可删除：

```text
app.js
app.css
```

V9.1 使用：

```text
src/main.js
src/core/
src/modules/
src/games/
styles/app.css
styles/games.css
```

## 缓存变化

Service Worker 缓存键：

```text
party-game-v9.1.0
```

旧缓存会在新 Service Worker 激活时自动清理。游戏进行中不会强制刷新，新版本提示只在页面底部显示。
