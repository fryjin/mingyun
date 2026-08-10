# V10.5 补丁应用说明

## 推荐方式

将补丁 ZIP 解压到项目目录外，然后执行：

```bash
node /path/to/mingyun-v10.5-closeout/apply-v10.5.mjs /path/to/mingyun
```

脚本会：

1. 验证目标项目名称和版本；
2. 将四个活跃 V9 命名 CSS 重命名为稳定名；
3. 删除 Legacy 游戏、`shared.js`、旧根入口和被替代样式；
4. 覆盖 `overlay/` 中的 V10.5 文件。

随后执行：

```bash
npm install
npm run verify
```

验证通过后再提交 Git。

## 使用 Codex / Git 手工应用

也可以直接读取 `OPERATIONS.json`：先完成 `renames` 和 `deletes`，再把 `overlay/` 按原路径覆盖到仓库根目录。

不要只上传 overlay 而跳过删除/重命名；V10.5 的架构校验会因此失败。
