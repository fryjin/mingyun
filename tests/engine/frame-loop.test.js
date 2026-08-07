import test from 'node:test';
import assert from 'node:assert/strict';
import { LifecycleScope } from '../../src/engine/lifecycle.js';
import { FrameLoop } from '../../src/engine/frame-loop.js';

test('FrameLoop clamps delta and continues scheduling', () => {
  const callbacks = [];
  const cancelled = [];
  const frames = [];
  const lifecycle = new LifecycleScope();
  const loop = new FrameLoop({
    lifecycle,
    maxDeltaMs: 34,
    schedule: callback => {
      callbacks.push(callback);
      return callbacks.length;
    },
    cancel: id => cancelled.push(id),
    onFrame: frame => {
      frames.push(frame);
      return frames.length < 2;
    }
  });

  loop.start();
  callbacks.shift()(100);
  callbacks.shift()(180);
  assert.equal(frames[0].deltaMs, 0);
  assert.equal(frames[1].deltaMs, 34);
  assert.equal(loop.isRunning(), false);
  lifecycle.dispose();
});

test('FrameLoop is stopped by lifecycle disposal', () => {
  const callbacks = [];
  const cancelled = [];
  const lifecycle = new LifecycleScope();
  const loop = new FrameLoop({
    lifecycle,
    schedule: callback => {
      callbacks.push(callback);
      return 9;
    },
    cancel: id => cancelled.push(id),
    onFrame: () => true
  });
  loop.start();
  lifecycle.dispose();
  assert.equal(loop.isRunning(), false);
  assert.deepEqual(cancelled, [9]);
});
