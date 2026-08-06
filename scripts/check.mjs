import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['src', 'scripts', 'tests'];
const files = [];

async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const target = join(path, entry.name);
    if (entry.isDirectory()) await walk(target);
    else files.push(target);
  }
}

for (const root of roots) await walk(root);
files.push('vite.config.js', 'sw.js');

const failures = [];
for (const file of files.filter(file => ['.js', '.mjs'].includes(extname(file)))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`${relative('.', file)}\n${result.stderr}`);
}

for (const file of files.filter(file => extname(file) === '.json')) {
  try { JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { failures.push(`${relative('.', file)}\n${error.message}`); }
}

if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}
console.log(`Checked ${files.length} files.`);
