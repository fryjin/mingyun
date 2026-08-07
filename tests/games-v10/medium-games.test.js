import test from 'node:test';
import assert from 'node:assert/strict';
import { RandomService, createSeededRandom } from '../../src/engine/random.js';
import { assignKingNumbers, formatKingInstruction, selectKingTargets } from '../../src/games-v10/king/rules.js';
import { resolveFingerSelection, resolveImmunePlayer } from '../../src/games-v10/i-did-it/rules.js';
import { drawBombDurationSeconds, getBombRange } from '../../src/games-v10/hot-potato/rules.js';

const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];

test('king assigns every number exactly once', () => {
  const random = new RandomService(createSeededRandom(7));
  const assignment = assignKingNumbers(players, random);
  assert.deepEqual([...assignment.values()].sort((a, b) => a - b), [1, 2, 3]);
});

test('king task formatter replaces target placeholders', () => {
  assert.equal(formatKingInstruction('{target1}和{target2}完成任务', [2, 3]), '2号和3号完成任务');
});

test('king target selection can exclude the king number', () => {
  const random = new RandomService(createSeededRandom(11));
  const assignment = new Map([['a', 1], ['b', 2], ['c', 3]]);
  const targets = selectKingTargets({ assignment, kingId: 'a', instruction: { targetCount: 2, allowKingAsTarget: false }, random });
  assert.deepEqual(new Set(targets), new Set([2, 3]));
});

test('finger selection eliminates player at zero', () => {
  const result = resolveFingerSelection({ players, fingers: new Map([['a', 1], ['b', 2], ['c', 2]]), eliminated: new Set(), selected: new Set(['a']) });
  assert.equal(result.eliminated.has('a'), true);
  assert.deepEqual(result.survivors.map(player => player.id), ['b', 'c']);
});

test('simultaneous zero chooses one immune player', () => {
  const random = new RandomService(createSeededRandom(4));
  const immune = resolveImmunePlayer({ before: players, survivors: [], random });
  assert.ok(players.some(player => player.id === immune.winner.id));
  assert.equal(immune.randomImmune, true);
});

test('single survivor is immune without random fallback', () => {
  const random = new RandomService(createSeededRandom(4));
  const immune = resolveImmunePlayer({ before: players, survivors: [players[1]], random });
  assert.equal(immune.winner.id, 'b');
  assert.equal(immune.randomImmune, false);
});

test('bomb ranges preserve configured durations', () => {
  assert.deepEqual(getBombRange('short'), [10, 20]);
  assert.deepEqual(getBombRange('standard'), [20, 40]);
  assert.deepEqual(getBombRange('long'), [40, 60]);
});

test('bomb duration is drawn inside configured range', () => {
  const random = new RandomService(createSeededRandom(9));
  for (let index = 0; index < 20; index += 1) {
    const seconds = drawBombDurationSeconds('short', random);
    assert.ok(seconds >= 10 && seconds <= 20);
  }
});
