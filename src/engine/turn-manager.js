export class TurnManager {
  constructor(players, { startIndex = 0, direction = 1 } = {}) {
    if (!Array.isArray(players) || players.length === 0) throw new Error('回合系统至少需要一位玩家');
    this.players = [...players];
    this.initialIndex = this.normalize(startIndex);
    this.index = this.initialIndex;
    this.direction = direction < 0 ? -1 : 1;
    this.round = 1;
    this.turn = 1;
  }

  normalize(index) {
    const length = this.players.length;
    return ((Number(index) % length) + length) % length;
  }

  current() {
    return this.players[this.index];
  }

  next({ steps = 1 } = {}) {
    const previous = this.index;
    this.index = this.normalize(this.index + this.direction * Math.max(1, Number(steps) || 1));
    this.turn += 1;
    if ((this.direction > 0 && this.index <= previous) || (this.direction < 0 && this.index >= previous)) this.round += 1;
    return this.current();
  }

  reverse() {
    this.direction *= -1;
    return this.direction;
  }

  setCurrent(playerId) {
    const target = this.players.findIndex(player => player.id === playerId);
    if (target < 0) return false;
    this.index = target;
    return true;
  }

  reset() {
    this.index = this.initialIndex;
    this.direction = 1;
    this.round = 1;
    this.turn = 1;
    return this.current();
  }

  snapshot() {
    return Object.freeze({
      player: this.current(),
      index: this.index,
      direction: this.direction,
      round: this.round,
      turn: this.turn
    });
  }
}
