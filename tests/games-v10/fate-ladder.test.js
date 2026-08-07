import test from 'node:test';
import assert from 'node:assert/strict';
import { RandomService, createSeededRandom } from '../../src/engine/random.js';
import {
  STACK_CONFIG,
  createBaseTower,
  evaluatePlacement,
  evaluateTower,
  safetyMarginRatio,
  speedFor
} from '../../src/games-v10/fate-ladder/physics.js';
import { FateStackSession } from '../../src/games-v10/fate-ladder/session.js';
import { cameraTransform } from '../../src/games-v10/fate-ladder/camera.js';

const players = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' }
];

test('V9.3.6 stack constants are preserved', () => {
  assert.equal(STACK_CONFIG.worldWidth, 1000);
  assert.equal(STACK_CONFIG.blockWidth, 500);
  assert.equal(STACK_CONFIG.baseWidth, 640);
  assert.equal(STACK_CONFIG.minOverlapRatio, .20);
  assert.equal(STACK_CONFIG.perfectRatio, .03);
  assert.equal(STACK_CONFIG.blockStep, 38);
  assert.equal(STACK_CONFIG.dropDistance, 88);
  assert.equal(STACK_CONFIG.maxVisibleBlocks, 8);
});

test('speed curve is preserved', () => {
  assert.deepEqual([0, 4, 8, 12].map(speedFor), [320, 360, 415, 470]);
});

test('safety margins are preserved', () => {
  assert.deepEqual([0, 5, 10].map(safetyMarginRatio), [.04, .05, .06]);
});

test('centered tower remains stable', () => {
  const tower = createBaseTower();
  tower.push({ left: 250, width: 500 });
  tower.push({ left: 250, width: 500 });
  const result = evaluateTower(tower);
  assert.equal(result.stable, true);
  assert.equal(result.state, 'stable');
});

test('placement below twenty percent overlap is a miss', () => {
  const tower = createBaseTower();
  tower.push({ left: 250, width: 500 });
  const result = evaluatePlacement(
    tower,
    { left: 690, width: 500, direction: 1 },
    'a'
  );
  assert.equal(result.outcome, 'miss');
});

test('cumulative center of mass can topple a locally overlapping tower', () => {
  const tower = [
    { left: 160, width: 640, base: true },
    { left: 0, width: 500 },
    { left: 140, width: 500 }
  ];
  const result = evaluatePlacement(
    tower,
    { left: 400, width: 500, direction: 1 },
    'c'
  );
  assert.equal(result.outcome, 'balance');
  assert.equal(result.balance.stable, false);
});

test('dangerous but stable tower is preserved', () => {
  const tower = [
    { left: 180, width: 640, base: true },
    { left: 0, width: 500 }
  ];
  const result = evaluatePlacement(
    tower,
    { left: 205, width: 500, direction: 1 },
    'b'
  );
  assert.equal(result.outcome, 'success');
  assert.equal(result.balance.state, 'danger');
});

test('session uses V10 state machine for heavy interaction phases', () => {
  const random = new RandomService(createSeededRandom(9));
  const session = new FateStackSession(players, random);
  assert.equal(session.machine.state, 'intro');
  session.beginTurn();
  assert.equal(session.machine.state, 'arming');
  session.armComplete();
  assert.equal(session.machine.state, 'moving');
  assert.equal(session.lockDrop(), true);
  assert.equal(session.machine.state, 'dropping');
});

test('session pause restarts current turn without recording failure', () => {
  const random = new RandomService(createSeededRandom(7));
  const session = new FateStackSession(players, random);
  const originalPlayer = session.currentPlayer().id;
  session.beginTurn();
  session.armComplete();
  assert.equal(session.pause(), true);
  assert.equal(session.machine.state, 'paused');
  assert.equal(session.height(), 0);
  assert.equal(session.currentPlayer().id, originalPlayer);
  session.beginTurn();
  assert.equal(session.machine.state, 'arming');
});

test('camera preserves V9.3.6 high tower limits', () => {
  const low = cameraTransform({ towerLength: 3, height: 2, arenaHeight: 490, includeMoving: true });
  const high = cameraTransform({ towerLength: 15, height: 14, arenaHeight: 490, includeMoving: true });
  assert.ok(low.scale <= 1 && low.scale >= .68);
  assert.ok(high.scale <= .72 && high.scale >= .68);
  assert.equal(high.shift, 22);
});
