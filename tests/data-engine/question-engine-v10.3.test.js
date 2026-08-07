import test from 'node:test';
import assert from 'node:assert/strict';
import { poolKeyFor } from '../../src/data-engine/question-engine.js';

test('pool key suffix separates parameterized content pools', () => {
  assert.equal(poolKeyFor('standard', {}, ''), 'all');
  assert.equal(poolKeyFor('standard', {}, 'v934:3'), 'all:v934:3');
  assert.notEqual(poolKeyFor('standard', {}, 'v934:3'), poolKeyFor('standard', {}, 'v934:10'));
});
