import { GAME_PLUGIN_CONTRACT, normalizeGamePlugin } from '../engine/plugin.js';

export class GameRegistry {
  constructor() {
    this.entries = new Map();
  }

  register(plugin, { source = 'v10' } = {}) {
    const normalized = normalizeGamePlugin(plugin);
    if (normalized.contractVersion !== GAME_PLUGIN_CONTRACT) {
      throw new Error(`仅支持 V10 游戏插件合约：${normalized.id}`);
    }
    if (source !== 'v10') throw new Error(`V10.5 已停止 Legacy 插件注册：${normalized.id}`);
    if (this.entries.has(normalized.id)) throw new Error(`游戏 ID 重复：${normalized.id}`);
    this.entries.set(normalized.id, {
      plugin: normalized,
      source: 'v10',
      contractVersion: GAME_PLUGIN_CONTRACT
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
