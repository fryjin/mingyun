export const GAME_PLUGIN_CONTRACT = 2;

const REQUIRED_TEXT = ['id', 'title', 'shortDescription', 'description'];

export function createGamePlugin(definition) {
  return normalizeGamePlugin({ ...definition, contractVersion: GAME_PLUGIN_CONTRACT });
}

export function normalizeGamePlugin(plugin) {
  if (!plugin || typeof plugin !== 'object') throw new TypeError('游戏插件必须是对象');
  for (const key of REQUIRED_TEXT) {
    if (typeof plugin[key] !== 'string' || !plugin[key].trim()) throw new TypeError(`游戏插件缺少 ${key}`);
  }
  if (typeof plugin.mount !== 'function') throw new TypeError('游戏插件缺少 mount()');
  const minPlayers = Math.max(1, Number(plugin.minPlayers) || 1);
  const maxPlayers = Math.max(minPlayers, Number(plugin.maxPlayers) || minPlayers);
  return {
    ...plugin,
    contractVersion: Number(plugin.contractVersion) || 1,
    sortOrder: Number(plugin.sortOrder) || 999,
    icon: plugin.icon || 'game',
    color: plugin.color || '#8c7db2',
    supportsAdult: plugin.supportsAdult !== false,
    estimatedTime: plugin.estimatedTime || '1–5 分钟',
    phoneMode: plugin.phoneMode || '轮流操作手机',
    resultMode: plugin.resultMode || '按游戏规则决定结果',
    defaultSettings: { level: 'standard', ...(plugin.defaultSettings || {}) },
    minPlayers,
    maxPlayers
  };
}
