export class PunishmentService {
  constructor(drawPunishment) {
    if (typeof drawPunishment !== 'function') throw new TypeError('惩罚服务需要抽取实现');
    this.drawPunishment = drawPunishment;
  }

  draw(losers, options = {}) {
    const list = Array.isArray(losers) ? losers : [losers];
    if (!list.length || list.some(player => !player?.name)) throw new Error('惩罚玩家无效');
    return this.drawPunishment(list, options);
  }
}
