import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeededRandom, RandomService } from '../../src/engine/random.js';

test('seeded random is reproducible', () => {
  const first = new RandomService(createSeededRandom(42));
  const second = new RandomService(createSeededRandom(42));
  assert.deepEqual([first.int(1, 10), first.int(1, 10), first.int(1, 10)], [second.int(1, 10), second.int(1, 10), second.int(1, 10)]);
});

test('shuffle keeps all values', () => {
  const random = new RandomService(createSeededRandom(7));
  const result = random.shuffle([1, 2, 3, 4]);
  assert.deepEqual([...result].sort(), [1, 2, 3, 4]);
});
