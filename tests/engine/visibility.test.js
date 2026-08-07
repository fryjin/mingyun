import test from 'node:test';
import assert from 'node:assert/strict';
import { LifecycleScope } from '../../src/engine/lifecycle.js';
import { bindPageVisibility } from '../../src/engine/visibility.js';

class FakeDocument extends EventTarget {
  constructor() { super(); this.hidden = false; }
  setHidden(value) { this.hidden = value; this.dispatchEvent(new Event('visibilitychange')); }
}

test('page visibility calls hidden and visible handlers', () => {
  const lifecycle = new LifecycleScope();
  const documentRef = new FakeDocument();
  const events = [];
  bindPageVisibility(lifecycle, { documentRef, onHidden: () => events.push('hidden'), onVisible: () => events.push('visible') });
  documentRef.setHidden(true);
  documentRef.setHidden(false);
  assert.deepEqual(events, ['hidden', 'visible']);
  lifecycle.dispose();
});

test('page visibility listener is removed with lifecycle', () => {
  const lifecycle = new LifecycleScope();
  const documentRef = new FakeDocument();
  let count = 0;
  bindPageVisibility(lifecycle, { documentRef, onHidden: () => { count += 1; } });
  lifecycle.dispose();
  documentRef.setHidden(true);
  assert.equal(count, 0);
});
