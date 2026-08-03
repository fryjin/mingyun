const LEVEL_KEYS = {
  1:'light',
  2:'standard',
  3:'bold',
  4:'adult'
};

export class GameContentLoader {
  constructor() {
    this.manifestUrl = new URL('../../data/games/manifest.json', import.meta.url);
    this.manifest = null;
    this.cache = new Map();
    this.recent = new Map();
  }

  async loadManifest() {
    if (this.manifest) return this.manifest;
    const response = await fetch(this.manifestUrl, { cache:'no-cache' });
    if (!response.ok) throw new Error(`玩法题库清单加载失败：${response.status}`);
    const manifest = await response.json();
    if (!Array.isArray(manifest?.files)) throw new Error('玩法题库清单格式无效');
    this.manifest = manifest;
    return manifest;
  }

  async loadBank(gameId, level = 2) {
    const normalizedLevel = Math.min(4, Math.max(1, Number(level) || 2));
    const key = `${gameId}:${normalizedLevel}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const manifest = await this.loadManifest();
    const entry = manifest.files.find((item) => item.gameId === gameId && Number(item.level) === normalizedLevel);
    if (!entry) throw new Error(`未找到 ${gameId} 的 ${LEVEL_KEYS[normalizedLevel]} 题库`);

    const response = await fetch(new URL(`../../${entry.file}`, import.meta.url));
    if (!response.ok) throw new Error(`玩法题库加载失败：${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload?.items)) throw new Error('玩法题库内容格式无效');
    if (payload.gameId !== gameId || Number(payload.level) !== normalizedLevel) throw new Error('玩法题库元数据不匹配');
    if (Number(payload.count) !== payload.items.length) throw new Error('玩法题库数量校验失败');

    const bank = payload.items.map((item) => Object.freeze({ ...item }));
    this.cache.set(key, bank);
    return bank;
  }

  async draw({ gameId, level = 2 } = {}) {
    if (!gameId) throw new Error('缺少 gameId');
    const normalizedLevel = Math.min(4, Math.max(1, Number(level) || 2));
    const bank = await this.loadBank(gameId, normalizedLevel);
    const key = `${gameId}:${normalizedLevel}`;
    const recentIds = this.recent.get(key) || [];
    const eligible = bank.filter((item) => !recentIds.includes(item.id));
    const pool = eligible.length ? eligible : bank;
    const item = pool[secureRandomInt(pool.length)];
    this.recent.set(key, [...recentIds, item.id].slice(-12));
    return { ...item };
  }

  clearAdultCache() {
    [...this.cache.keys()].filter((key) => key.endsWith(':4')).forEach((key) => this.cache.delete(key));
    [...this.recent.keys()].filter((key) => key.endsWith(':4')).forEach((key) => this.recent.delete(key));
  }

  getLoadedBanks() {
    return [...this.cache.keys()];
  }
}

function secureRandomInt(max) {
  if (!Number.isFinite(max) || max <= 0) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return Math.floor((values[0] / 4294967296) * max);
  }
  return Math.floor(Math.random() * max);
}
