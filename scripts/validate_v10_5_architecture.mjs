import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const EXPECTED_VERSION = '10.5.0';
const EXPECTED_BUILD = 'v10.5.0-architecture-closeout';
const legacyGames = [
  'chaos-rules.js','dice.js','fate-ladder.js','five-second.js','hot-potato.js','i-did-it.js',
  'king.js','most-likely.js','two-truths-one-lie.js','undercover.js','wheel.js','would-rather.js','shared.js'
];
const removedRoot = ['app.js','app.css','manifest.json','src/main.js','src/modules/games.js'];
const removedStyles = [
  'fate-stack-v9.3.2.css','fate-stack-v9.3.3.css','fate-stack-v9.3.5.css','fate-stack-v9.3.6.css',
  'fate-wheel-v9.2.4.css','game-expansion-v9.3.css','game-rules-v9.3.3.css'
];
const stableStyles = ['fate-stack.css','fate-wheel.css','game-expansion.css','game-rules.css'];
const failures = [];

async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function text(path) { return readFile(path, 'utf8'); }

const packageJson = JSON.parse(await text('package.json'));
if (packageJson.version !== EXPECTED_VERSION) failures.push(`package.json version != ${EXPECTED_VERSION}`);

const index = await text('index.html');
if (!index.includes(`V${EXPECTED_VERSION}`) || !index.includes(EXPECTED_BUILD)) failures.push('index.html 版本标识不一致');
for (const style of stableStyles) if (!index.includes(`./styles/${style}`)) failures.push(`index.html 未加载 ${style}`);
if (/styles\/[^"]*v9\./i.test(index)) failures.push('index.html 仍引用 V9 命名样式');

const bootstrap = await text('src/app/bootstrap.js');
if (!bootstrap.includes(`VERSION = '${EXPECTED_VERSION}'`) || !bootstrap.includes(EXPECTED_BUILD)) failures.push('bootstrap 版本标识不一致');

const sw = await text('sw.js');
if (!sw.includes('party-game-v10.5.0-architecture-closeout')) failures.push('静态 Service Worker 缓存键未升级');
for (const legacy of legacyGames) if (sw.includes(`/src/games/${legacy}`)) failures.push(`Service Worker 仍缓存 ${legacy}`);
for (const oldStyle of removedStyles) if (sw.includes(oldStyle)) failures.push(`Service Worker 仍缓存 ${oldStyle}`);

const vite = await text('vite.config.js');
if (!vite.includes("APP_VERSION = '10.5.0'")) failures.push('Vite Service Worker 版本未升级');
if (!vite.includes("base: './'")) failures.push('Vite base 必须保持相对路径以兼容 Pages 子路径');

const gameIndex = await text('src/games/index.js');
const pluginImports = [...gameIndex.matchAll(/import ['"]\.\.\/games-v10\/([^/]+)\/index\.js['"];?/g)].map(match => match[1]);
if (pluginImports.length !== 12) failures.push(`运行入口应包含 12 个 V10 插件，当前 ${pluginImports.length}`);
if (/import ['"]\.\/[^'"]+['"]/.test(gameIndex)) failures.push('src/games/index.js 仍包含 Legacy 本地游戏导入');

const gameFiles = (await readdir('src/games')).filter(name => name.endsWith('.js')).sort();
const allowedGameFiles = ['index.js','registry.js'];
if (JSON.stringify(gameFiles) !== JSON.stringify(allowedGameFiles)) failures.push(`src/games 未收口：${gameFiles.join(', ')}`);

for (const file of legacyGames.map(name => join('src/games', name))) if (await exists(file)) failures.push(`Legacy 文件仍存在：${file}`);
for (const file of removedRoot) if (await exists(file)) failures.push(`旧根入口仍存在：${file}`);
for (const file of removedStyles.map(name => join('styles', name))) if (await exists(file)) failures.push(`旧样式仍存在：${file}`);
for (const file of stableStyles.map(name => join('styles', name))) if (!(await exists(file))) failures.push(`稳定样式缺失：${file}`);

async function walk(path) {
  const out = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target));
    else if (entry.name.endsWith('.js')) out.push(target);
  }
  return out;
}
for (const file of await walk('src')) {
  const source = await text(file);
  if (source.includes('games/shared.js')) failures.push(`${file} 仍依赖 games/shared.js`);
  if (/games\/(chaos-rules|dice|fate-ladder|five-second|hot-potato|i-did-it|king|most-likely|two-truths-one-lie|undercover|wheel|would-rather)\.js/.test(source)) failures.push(`${file} 仍引用 Legacy 游戏实现`);
}
if (!(await exists('src/app/game-context.js'))) failures.push('缺少 src/app/game-context.js');
const application = await text('src/app/application.js');
if (!application.includes("from './game-context.js'")) failures.push('Application 未切换到 app/game-context');

for (const workflow of ['.github/workflows/ci.yml','.github/workflows/pages.yml']) {
  if (!(await exists(workflow))) failures.push(`缺少工作流：${workflow}`);
}

if (failures.length) {
  console.error('V10.5 architecture validation failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`V10.5 architecture validated: ${pluginImports.length}/12 V10 plugins, Legacy runtime = 0.`);
