import test from 'node:test';
import assert from 'node:assert/strict';
import { RandomService, createSeededRandom } from '../../src/engine/random.js';
import { punishmentTarget, validateStoryPrompts, voteGroups } from '../../src/games-v10/two-truths-one-lie/rules.js';
import { assignRoles, normalizeUndercoverCount, resolveVote, resolveWinner } from '../../src/games-v10/undercover/rules.js';
import { drawRightForPlayer, RIGHTS, supportsChallengeSeconds } from '../../src/games-v10/chaos-rules/rules.js';
import { ChaosSession } from '../../src/games-v10/chaos-rules/session.js';

const players = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 'd', name: 'D' }
];

test('two truths validates three distinct prompts', () => {
  assert.equal(validateStoryPrompts(['甲', '乙', '丙']).ok, true);
  assert.equal(validateStoryPrompts(['甲', '', '丙']).ok, false);
  assert.equal(validateStoryPrompts(['甲', '甲', '丙']).ok, false);
});

test('two truths separates correct and wrong voters', () => {
  const voters = players.slice(1);
  const votes = new Map([['b', 1], ['c', 2], ['d', 1]]);
  const groups = voteGroups({ voters, votes, lieIndex: 1 });
  assert.deepEqual(groups.correct.map(player => player.id), ['b', 'd']);
  assert.deepEqual(groups.wrong.map(player => player.id), ['c']);
});

test('two truths punishment keeps offline wrong-player selection', () => {
  assert.equal(punishmentTarget({ narrator: players[0], wrong: [] }).players[0].id, 'a');
  assert.equal(punishmentTarget({ narrator: players[0], wrong: [players[1]] }).players[0].id, 'offline-selected-player');
});

test('undercover count is clamped by player count', () => {
  assert.equal(normalizeUndercoverCount(3, 4), 2);
  assert.equal(normalizeUndercoverCount(3, 12), 3);
});

test('undercover assigns exact role count', () => {
  const random = new RandomService(createSeededRandom(12));
  const roles = assignRoles(players, 1, random);
  assert.equal([...roles.values()].filter(role => role === 'undercover').length, 1);
});

test('undercover vote resolves ties through random service', () => {
  const random = new RandomService(createSeededRandom(3));
  const result = resolveVote({ alive: players, votes: ['a', 'b', 'a', 'b'], random });
  assert.equal(result.tied.length, 2);
  assert.ok(['a', 'b'].includes(result.eliminated.id));
});

test('undercover winner conditions match legacy rules', () => {
  const roles = new Map([['a', 'undercover'], ['b', 'civilian'], ['c', 'civilian'], ['d', 'civilian']]);
  assert.equal(resolveWinner(players.slice(1), roles), 'civilian');
  assert.equal(resolveWinner([players[0], players[1]], roles), 'undercover');
});

test('chaos right draw prefers unowned rights', () => {
  const random = new RandomService(() => 0);
  const right = drawRightForPlayer([RIGHTS.shield], random);
  assert.notEqual(right.id, 'shield');
});

test('chaos challenge seconds filter preserves supported seconds', () => {
  assert.equal(supportsChallengeSeconds({ type: 'challenge', supportedSeconds: [3, 5] }, 5), true);
  assert.equal(supportsChallengeSeconds({ type: 'challenge', supportedSeconds: [3, 5] }, 10), false);
  assert.equal(supportsChallengeSeconds({ type: 'persistent' }, 10), true);
});

test('chaos session records and undoes mistakes', () => {
  const session = new ChaosSession(players, { limit: 3 });
  session.recordMistake(players[0], 'challenge');
  assert.equal(session.mistakes.get('a'), 1);
  assert.equal(session.undoLastMistake(), true);
  assert.equal(session.mistakes.get('a'), 0);
});

test('chaos session keeps three active rules and replaces oldest', () => {
  const session = new ChaosSession(players, { limit: 3 });
  session.addPersistentRule({ duration: 5 }, '规则1');
  session.addPersistentRule({ duration: 5 }, '规则2');
  session.addPersistentRule({ duration: 5 }, '规则3');
  const result = session.addPersistentRule({ duration: 5 }, '规则4');
  assert.equal(session.activeRules.length, 3);
  assert.equal(result.replaced, '规则1');
  assert.deepEqual(session.activeRules.map(rule => rule.instruction), ['规则2', '规则3', '规则4']);
});

test('chaos fresh persistent rule does not lose duration before next player starts', () => {
  const session = new ChaosSession(players, { limit: 3 });
  session.addPersistentRule({ duration: 2 }, '规则');
  session.advanceTurn();
  assert.equal(session.activeRules[0].remaining, 2);
  session.advanceTurn();
  assert.equal(session.activeRules[0].remaining, 1);
});

test('chaos session enforces two-right inventory before replacement UI', () => {
  const session = new ChaosSession(players, { limit: 3 });
  assert.equal(session.collectRight('a', RIGHTS.shield).status, 'added');
  assert.equal(session.collectRight('a', RIGHTS.transfer).status, 'added');
  assert.equal(session.collectRight('a', RIGHTS['cancel-rule']).status, 'full');
  assert.equal(session.ownedRights('a').length, 2);
});

test('chaos conflict group replaces matching persistent rule', () => {
  const session = new ChaosSession(players, { limit: 3 });
  session.addPersistentRule({ duration: 5, conflictGroup: 'voice' }, '规则A');
  const result = session.addPersistentRule({ duration: 5, conflictGroup: 'voice' }, '规则B');
  assert.equal(result.replaced, '规则A');
  assert.deepEqual(session.activeRules.map(rule => rule.instruction), ['规则B']);
});

test('chaos mistake result reports reaching configured limit', () => {
  const session = new ChaosSession(players, { limit: 2 });
  assert.equal(session.recordMistake(players[0], 'challenge').reachedLimit, false);
  assert.equal(session.recordMistake(players[0], 'rule').reachedLimit, true);
});
