import test from 'node:test';
import assert from 'node:assert/strict';
import { GameRegistry } from '../../src/games/registry.js';

const plugin = id => ({
  id,
  title: id,
  shortDescription: 'short',
  description: 'description',
  minPlayers: 2,
  maxPlayers: 4,
  mount() {}
});

test('registry keeps compatibility and metadata', () => {
  const registry = new GameRegistry();
  registry.register(plugin('legacy'));
  registry.register({ ...plugin('modern'), contractVersion: 2 }, { source: 'v10' });
  assert.equal(registry.get('legacy').contractVersion, 1);
  assert.equal(registry.get('modern').contractVersion, 2);
  assert.equal(registry.records().find(entry => entry.plugin.id === 'modern').source, 'v10');
});

test('registry rejects duplicate ids', () => {
  const registry = new GameRegistry();
  registry.register(plugin('same'));
  assert.throws(() => registry.register(plugin('same')), /重复/);
});
