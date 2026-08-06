import test from 'node:test';
import assert from 'node:assert/strict';
import { TurnManager } from '../../src/engine/turn-manager.js';

const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];

test('TurnManager cycles players and rounds', () => {
  const turn = new TurnManager(players);
  assert.equal(turn.current().id, 'a');
  assert.equal(turn.next().id, 'b');
  assert.equal(turn.next().id, 'c');
  assert.equal(turn.next().id, 'a');
  assert.equal(turn.round, 2);
});

test('TurnManager supports reverse and direct selection', () => {
  const turn = new TurnManager(players);
  turn.reverse();
  assert.equal(turn.next().id, 'c');
  assert.equal(turn.setCurrent('b'), true);
  assert.equal(turn.current().id, 'b');
  assert.equal(turn.setCurrent('missing'), false);
});
