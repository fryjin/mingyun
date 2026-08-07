import test from 'node:test';
import assert from 'node:assert/strict';
import wheel, { wheelProgress } from '../../src/games-v10/wheel/index.js';
import wouldRather, { resolveWouldRather } from '../../src/games-v10/would-rather/index.js';
import fiveSecond from '../../src/games-v10/five-second/index.js';

const players = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 'd', name: 'D' }
];

test('V10.1 migrated games use contract version 2 and keep ids', () => {
  assert.deepEqual(
    [wheel, wouldRather, fiveSecond].map(game => [game.id, game.contractVersion]),
    [['wheel', 2], ['would-rather', 2], ['five-second', 2]]
  );
  assert.equal(wheel.defaultSettings.turns, 5);
  assert.equal(wouldRather.defaultSettings.settlement, 'minority');
  assert.equal(fiveSecond.defaultSettings.seconds, 5);
});

test('wheel progress is bounded and monotonic', () => {
  const values = Array.from({ length: 21 }, (_, index) => wheelProgress(index / 20));
  assert.ok(Math.abs(values[0]) < 1e-9);
  assert.ok(Math.abs(values.at(-1) - 1) < 1e-9);
  for (let index = 1; index < values.length; index += 1) {
    assert.ok(values[index] >= values[index - 1]);
  }
});

test('would-rather resolves tie, minority and unanimous minority safely', () => {
  const tie = resolveWouldRather({
    players,
    settlement: 'minority',
    choices: [
      { player: players[0], value: 'A' },
      { player: players[1], value: 'A' },
      { player: players[2], value: 'B' },
      { player: players[3], value: 'B' }
    ]
  });
  assert.deepEqual(tie.losers.map(player => player.id), ['a', 'b', 'c', 'd']);

  const minority = resolveWouldRather({
    players,
    settlement: 'minority',
    choices: [
      { player: players[0], value: 'A' },
      { player: players[1], value: 'B' },
      { player: players[2], value: 'B' },
      { player: players[3], value: 'B' }
    ]
  });
  assert.deepEqual(minority.losers.map(player => player.id), ['a']);

  const unanimous = resolveWouldRather({
    players,
    settlement: 'minority',
    choices: players.map(player => ({ player, value: 'A' }))
  });
  assert.deepEqual(unanimous.losers, []);
});
