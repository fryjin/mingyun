import test from 'node:test';
import assert from 'node:assert/strict';
import { LifecycleScope } from '../../src/engine/lifecycle.js';
import { AnimationRegistry } from '../../src/motion/animation-registry.js';

function fakeAnimation() {
  let resolve;
  const finished = new Promise(done => { resolve = done; });
  return {
    finished,
    cancelled: false,
    cancel() { this.cancelled = true; },
    finish() { resolve(); }
  };
}

test('AnimationRegistry removes finished animations', async () => {
  const lifecycle = new LifecycleScope();
  const registry = new AnimationRegistry(lifecycle);
  const animation = fakeAnimation();
  registry.track(animation);
  assert.equal(registry.size(), 1);
  animation.finish();
  await animation.finished;
  await Promise.resolve();
  assert.equal(registry.size(), 0);
  lifecycle.dispose();
});

test('AnimationRegistry cancels active animations on lifecycle disposal', () => {
  const lifecycle = new LifecycleScope();
  const registry = new AnimationRegistry(lifecycle);
  const animation = fakeAnimation();
  registry.track(animation);
  lifecycle.dispose();
  assert.equal(animation.cancelled, true);
  assert.equal(registry.size(), 0);
});
