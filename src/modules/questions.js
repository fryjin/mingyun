const LEVEL_KEYS = {
  1: 'light',
  2: 'standard',
  3: 'bold',
  4: 'adult'
};

const TYPE_KEYS = new Set(['truth', 'dare']);

export class QuestionLoader {
  constructor() {
    this.manifestUrl = new URL('../../data/questions/manifest.json', import.meta.url);
    this.manifest = null;
    this.cache = new Map();
    this.recent = new Map();
  }

  async loadManifest() {
    if (this.manifest) return this.manifest;
    const response = await fetch(this.manifestUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`题库清单加载失败：${response.status}`);
    const manifest = await response.json();
    if (!manifest?.files || !Array.isArray(manifest.files)) throw new Error('题库清单格式无效');
    this.manifest = manifest;
    return manifest;
  }

  async loadBank(level, type) {
    const normalizedLevel = Math.min(4, Math.max(1, Number(level) || 2));
    if (!TYPE_KEYS.has(type)) throw new Error('不支持的题目类型');
    const key = `${normalizedLevel}:${type}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const manifest = await this.loadManifest();
    const levelKey = LEVEL_KEYS[normalizedLevel];
    const entry = manifest.files.find((item) => item.level === normalizedLevel && item.type === type)
      || manifest.files.find((item) => item.file.includes(`${levelKey}-${type}.json`));

    if (!entry) throw new Error(`未找到 ${levelKey}-${type} 题库`);

    const url = new URL(`../../${entry.file}`, import.meta.url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`题库加载失败：${response.status}`);
    const payload = await response.json();

    if (!Array.isArray(payload?.items)) throw new Error('题库内容格式无效');
    if (Number(payload.count) !== payload.items.length) throw new Error('题库数量校验失败');

    const bank = payload.items.map((item) => Object.freeze({ ...item }));
    this.cache.set(key, bank);
    return bank;
  }

  async draw({ level = 2, type = null } = {}) {
    const selectedType = TYPE_KEYS.has(type) ? type : secureRandomInt(2) === 0 ? 'truth' : 'dare';
    const bank = await this.loadBank(level, selectedType);
    const key = `${level}:${selectedType}`;
    const recentIds = this.recent.get(key) || [];
    const eligible = bank.filter((item) => !recentIds.includes(item.id));
    const pool = eligible.length ? eligible : bank;
    const question = pool[secureRandomInt(pool.length)];

    const nextRecent = [...recentIds, question.id].slice(-24);
    this.recent.set(key, nextRecent);

    return { ...question, type: selectedType };
  }

  async preload(level, type) {
    return this.loadBank(level, type);
  }

  clearAdultCache() {
    this.cache.delete('4:truth');
    this.cache.delete('4:dare');
    this.recent.delete('4:truth');
    this.recent.delete('4:dare');
  }

  getLoadedBanks() {
    return [...this.cache.keys()];
  }
}

function secureRandomInt(max) {
  if (max <= 0) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return Math.floor((values[0] / 4294967296) * max);
  }
  return Math.floor(Math.random() * max);
}
