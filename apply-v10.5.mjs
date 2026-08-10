#!/usr/bin/env node
import { access, cp, mkdir, readFile, readdir, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const patchRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(process.argv[2] || '.');
const ops = JSON.parse(await readFile(join(patchRoot, 'OPERATIONS.json'), 'utf8'));
const overlay = join(patchRoot, 'overlay');

async function exists(path) { try { await access(path); return true; } catch { return false; } }

const packagePath = join(repoRoot, 'package.json');
if (!(await exists(packagePath))) throw new Error(`未找到 package.json：${repoRoot}`);
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
if (packageJson.name !== 'mingyun-party-game') throw new Error('目标目录不是 mingyun-party-game');
if (packageJson.version !== ops.baseVersion && packageJson.version !== ops.targetVersion) {
  throw new Error(`补丁只支持 ${ops.baseVersion} -> ${ops.targetVersion}，当前 ${packageJson.version}`);
}

for (const item of ops.renames) {
  const from = join(repoRoot, item.from);
  const to = join(repoRoot, item.to);
  const hasFrom = await exists(from);
  const hasTo = await exists(to);
  if (hasFrom && !hasTo) {
    await mkdir(dirname(to), { recursive: true });
    await rename(from, to);
  } else if (hasFrom && hasTo) {
    throw new Error(`重命名目标已存在，请人工确认：${item.to}`);
  } else if (!hasFrom && !hasTo) {
    throw new Error(`缺少待重命名文件：${item.from}`);
  }
}

for (const item of ops.deletes) await rm(join(repoRoot, item.path), { force: true });

async function copyTree(source, target) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copyTree(from, to);
    } else {
      await mkdir(dirname(to), { recursive: true });
      await cp(from, to, { force: true });
    }
  }
}
await copyTree(overlay, repoRoot);
console.log(`V10.5 overlay applied to ${repoRoot}`);
console.log('Next: npm install && npm run verify');
