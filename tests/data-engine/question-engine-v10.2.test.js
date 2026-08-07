import test from 'node:test';
import assert from 'node:assert/strict';
import { createEligibilityPredicate } from '../../src/data-engine/question-engine.js';

test('custom predicate is combined with adult boundary filtering', () => {
  const filter = createEligibilityPredicate('adult-plus', { contact: false, contactLevel: 1, kissing: false, alcohol: false }, item => item.targetCount <= 2);
  assert.equal(filter({ targetCount: 2, requirements: {} }), true);
  assert.equal(filter({ targetCount: 3, requirements: {} }), false);
  assert.equal(filter({ targetCount: 1, requirements: { contact: true } }), false);
});

test('standard level still applies custom predicate', () => {
  const filter = createEligibilityPredicate('standard', {}, item => item.enabled === true);
  assert.equal(filter({ enabled: true }), true);
  assert.equal(filter({ enabled: false }), false);
});
