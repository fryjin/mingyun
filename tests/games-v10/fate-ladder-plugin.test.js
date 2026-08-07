import test from 'node:test';
import assert from 'node:assert/strict';
import plugin from '../../src/games-v10/fate-ladder/index.js';

test('fate ladder is a V10 contract plugin', () => {
  assert.equal(plugin.id, 'fate-ladder');
  assert.equal(plugin.contractVersion, 2);
  assert.equal(plugin.minPlayers, 2);
  assert.equal(plugin.maxPlayers, 12);
  assert.equal(plugin.defaultSettings.level, 'standard');
});
