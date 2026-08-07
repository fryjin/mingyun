import test from 'node:test';
import assert from 'node:assert/strict';
import { StateMachine } from '../../src/engine/state-machine.js';

test('state machine accepts declared transition', () => {
  const machine = new StateMachine({ initial: 'idle', transitions: { idle: ['ready'], ready: ['done'] } });
  assert.equal(machine.can('ready'), true);
  machine.transition('ready');
  assert.equal(machine.state, 'ready');
  machine.transition('done');
  assert.equal(machine.state, 'done');
});

test('state machine rejects undeclared transition', () => {
  const machine = new StateMachine({ initial: 'idle', transitions: { idle: ['ready'] } });
  assert.throws(() => machine.transition('done'), /非法状态切换/);
  assert.equal(machine.state, 'idle');
});

test('state machine reset returns to initial state and replaces context', () => {
  const machine = new StateMachine({ initial: 'a', transitions: { a: ['b'] }, context: { value: 1 } });
  machine.transition('b', { value: 2 });
  machine.reset({ value: 3 });
  assert.equal(machine.state, 'a');
  assert.equal(machine.snapshot().context.value, 3);
});
