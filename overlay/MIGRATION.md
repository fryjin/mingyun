# 部署说明（V10.5）

## 前置版本

本补丁以 V10.4 稳定基线 `8a802fd2181630d9191a536e6f7cda23ba20d29f` 为前置版本。

## 应用顺序

1. 先执行补丁包中的文件重命名与删除操作。
2. 覆盖 `overlay/` 中的新文件和修改文件。
3. 运行 `npm install`。
4. 运行 `npm run verify`。
5. 提交到 GitHub。
6. 在 GitHub Pages 将发布源设置为 GitHub Actions。
7. 由 `Deploy Pages` 工作流发布 `dist/`。

## 注意

本轮删除的是已经退出运行入口的 Legacy 实现。不要只覆盖新文件而跳过删除/重命名步骤，否则 `check:architecture` 会主动失败。
