import { randomService } from '../engine/random.js';

export class ContentRepository {
  constructor({ fetcher = globalThis.fetch?.bind(globalThis), baseUrl = './data' } = {}) {
    if (typeof fetcher !== 'function') throw new TypeError('ContentRepository 需要 fetch 实现');
    this.fetcher = fetcher;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cache = new Map();
    this.bags = new Map();
  }

  async load(path, { validate } = {}) {
    const normalized = String(path).replace(/^\//, '');
    if (!this.cache.has(normalized)) {
      this.cache.set(normalized, this.fetcher(`${this.baseUrl}/${normalized}`).then(async response => {
        if (!response.ok) throw new Error(`内容加载失败：${normalized}`);
        const data = await response.json();
        if (validate && !validate(data)) throw new Error(`内容格式无效：${normalized}`);
        return data;
      }).catch(error => {
        this.cache.delete(normalized);
        throw error;
      }));
    }
    return this.cache.get(normalized);
  }

  async draw(path, { predicate = () => true, key = 'default', idOf = item => item.id, random = randomService } = {}) {
    const data = await this.load(path);
    const items = (Array.isArray(data) ? data : data.items || []).filter(predicate);
    if (!items.length) throw new Error('没有符合条件的内容');
    const bagKey = `${path}:${key}`;
    let bag = this.bags.get(bagKey) || [];
    const available = items.filter(item => !bag.includes(idOf(item)));
    const pool = available.length ? available : items;
    if (!available.length) bag = [];
    const item = random.pick(pool);
    this.bags.set(bagKey, [...bag, idOf(item)]);
    return item;
  }

  clear(path) {
    if (path) this.cache.delete(String(path).replace(/^\//, ''));
    else this.cache.clear();
  }
}
