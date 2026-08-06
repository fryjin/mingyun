import { normalizeGamePlugin } from '../engine/plugin.js';

export class GameRegistry {
  constructor() {
    this.entries = new Map();
  }

  register(plugin, { source = 'legacy' } = {}) {
    const normalized = normalizeGamePlugin(plugin);
    if (this.entries.has(normalized.id)) throw new Error(`游戏 ID 重复：${normalized.id}`);
    this.entries.set(normalized.id, {
      plugin: normalized,
      source,
      contractVersion: normalized.contractVersion
    });
    return normalized;
  }

  get(id) {
    return this.entries.get(id)?.plugin;
  }

  list() {
    return [...this.entries.values()].map(entry => entry.plugin).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  records() {
    return [...this.entries.values()].map(entry => ({ ...entry }));
  }

  has(id) {
    return this.entries.has(id);
  }
}

export const gameRegistry = new GameRegistry();
export const registerGame = (plugin, options) => gameRegistry.register(plugin, options);
export const getGame = id => gameRegistry.get(id);
export const listGames = () => gameRegistry.list();
export const listGameRecords = () => gameRegistry.records();
