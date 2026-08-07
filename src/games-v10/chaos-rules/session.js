import { TurnManager } from '../../engine/turn-manager.js';
import { ACTIVE_RULE_LIMIT, RIGHT_LIMIT } from './rules.js';

export class ChaosSession {
  constructor(players, { limit = 3 } = {}) {
    this.players = [...players];
    this.limit = limit;
    this.ruleSequence = 0;
    this.reset();
  }

  reset() {
    this.turns = new TurnManager(this.players);
    this.mistakes = new Map(this.players.map(player => [player.id, 0]));
    this.rights = new Map(this.players.map(player => [player.id, []]));
    this.activeRules = [];
    this.lastNotice = '';
    this.lastMistake = null;
    this.ruleSequence = 0;
  }

  currentPlayer() {
    return this.turns.current();
  }

  get turn() {
    return this.turns.turn;
  }

  ownedRights(playerId) {
    return this.rights.get(playerId) || [];
  }

  hasRight(playerId, rightId) {
    return this.ownedRights(playerId).some(right => right.id === rightId);
  }

  consumeRight(playerId, rightId) {
    const list = this.ownedRights(playerId);
    const index = list.findIndex(right => right.id === rightId);
    if (index < 0) return false;
    const next = [...list];
    next.splice(index, 1);
    this.rights.set(playerId, next);
    return true;
  }

  collectRight(playerId, right) {
    const list = this.ownedRights(playerId);
    if (list.some(item => item.id === right.id)) return { status: 'duplicate', list };
    if (list.length >= RIGHT_LIMIT) return { status: 'full', list };
    this.rights.set(playerId, [...list, right]);
    return { status: 'added', list: this.ownedRights(playerId) };
  }

  replaceRight(playerId, oldRightId, right) {
    const list = this.ownedRights(playerId);
    this.rights.set(playerId, list.map(old => old.id === oldRightId ? right : old));
  }

  addPersistentRule(item, instruction) {
    const conflictGroup = item.conflictGroup || '';
    let replaced = '';
    if (conflictGroup) {
      const conflict = this.activeRules.find(rule => rule.conflictGroup === conflictGroup);
      if (conflict) {
        replaced = conflict.instruction;
        this.activeRules = this.activeRules.filter(rule => rule.id !== conflict.id);
      }
    }
    if (this.activeRules.length >= ACTIVE_RULE_LIMIT) {
      const oldest = this.activeRules.shift();
      replaced ||= oldest.instruction;
    }
    const rule = {
      id: `rule-${this.turn}-${++this.ruleSequence}`,
      instruction,
      trigger: item.trigger || '',
      action: item.action || '',
      conflictGroup,
      remaining: Number(item.duration || 5),
      fresh: true
    };
    this.activeRules.push(rule);
    return { rule, replaced };
  }

  removeRule(ruleId) {
    const removed = this.activeRules.find(rule => rule.id === ruleId) || null;
    this.activeRules = this.activeRules.filter(rule => rule.id !== ruleId);
    return removed;
  }

  recordMistake(player, source) {
    const previous = this.mistakes.get(player.id) || 0;
    const next = previous + 1;
    this.mistakes.set(player.id, next);
    this.lastMistake = { playerId: player.id, previous, source };
    this.lastNotice = `${player.name} 增加 1 次失误。`;
    return { previous, next, reachedLimit: next >= this.limit };
  }

  undoLastMistake() {
    if (!this.lastMistake) return false;
    this.mistakes.set(this.lastMistake.playerId, this.lastMistake.previous);
    this.lastMistake = null;
    this.lastNotice = '已撤销上一条失误记录。';
    return true;
  }

  advanceTurn() {
    const expired = [];
    this.activeRules = this.activeRules.map(rule => {
      if (rule.fresh) return { ...rule, fresh: false };
      const remaining = rule.remaining - 1;
      if (remaining <= 0) expired.push(rule.instruction);
      return { ...rule, remaining };
    }).filter(rule => rule.remaining > 0);
    this.turns.next();
    this.lastMistake = null;
    if (expired.length) this.lastNotice = `持续法则已到期：${expired.join('、')}`;
    return expired;
  }
}
