import test from 'node:test';
import assert from 'node:assert/strict';
import { GameRegistry } from '../../src/games/registry.js';
import { createGamePlugin } from '../../src/engine/plugin.js';

const plugin = id => createGamePlugin({
  id,
  title: id,
  shortDescription: 'short',
  description: 'description',
  minPlayers: 2,
  maxPlayers: 4,
  mount() {}
});

test('registry accepts only V10 contract plugins', () => {
  const registry = new GameRegistry();
  registry.register(plugin('modern'));
  const record = registry.records()[0];
  assert.equal(record.source, 'v10');
  assert.equal(record.contractVersion, 2);
});

test('registry rejects legacy contract plugins and sources', () => {
  const registry = new GameRegistry();
  assert.throws(() => registry.register({
    id: 'legacy',
    title: 'legacy',
    shortDescription: 'short',
    description: 'description',
    minPlayers: 2,
    maxPlayers: 4,
    mount() {}
  }), /V10 游戏插件合约/);
  assert.throws(() => registry.register(plugin('wrong-source'), { source: 'legacy' }), /停止 Legacy/);
});

test('registry rejects duplicate ids', () => {
  const registry = new GameRegistry();
  registry.register(plugin('same'));
  assert.throws(() => registry.register(plugin('same')), /重复/);
});
