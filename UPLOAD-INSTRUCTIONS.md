# V9.3 国王游戏补丁上传说明

目标仓库：`fryjin/mingyun`

## 上传方法

1. 下载并解压补丁包。
2. 打开解压后的 `party-game-v9.3-king-patch` 文件夹。
3. 将文件夹内的全部文件和目录拖入 GitHub 仓库根目录。
4. GitHub 提示同名文件时，使用本补丁版本覆盖。
5. 建议提交说明：

```text
feat: add V9.3 king game plugin
```

6. 等待 GitHub Pages 部署完成。
7. 手机端刷新两次；仍显示旧版时，清除该站点缓存或从浏览器站点设置中删除旧 Service Worker。

## 不要删除

仓库中以下现有目录必须保留：

```text
data/questions/
data/games/most-likely/
data/games/would-rather/
data/games/five-second/
data/games/hot-potato/
src/games/most-likely.js
src/games/would-rather.js
src/games/five-second.js
src/games/hot-potato.js
```

本补丁的 `data/games/manifest.json` 已同时保留 V9.2 四种玩法的清单记录。

## 部署后重点验收

### 随机题库模式

1. 首页“国王游戏”不再显示“待接入”。
2. 进入设置，保持“随机题库”。
3. 全部玩家依次查看身份。
4. 确认只有一位国王，其他号码不重复。
5. 国王接管手机后能正常抽取指令。
6. 指令中的号码与号码徽章一致。
7. 揭晓后显示正确玩家。
8. 下一轮会重新洗牌。

### 国王自定模式

1. 设置中选择“国王自定”。
2. 可选择默认目标 1 人或 2 人。
3. 国王阶段可输入最多 80 字指令，也可留空。
4. 抽取号码后才能点击揭晓。
5. 揭晓后可重新编辑或进入下一轮。

### 隐私与安全

- 身份查看前必须经过交接屏。
- 身份页切到后台再返回时应重新隐藏。
- 成人档首次选择时仍显示 18+ 自愿确认。
- 任一指令都可以跳过或换题。
