const registry = new Map();
export function registerGame(plugin) {
  if (!plugin?.id || typeof plugin.mount !== 'function') throw new TypeError('无效游戏插件');
  registry.set(plugin.id, plugin);
}
export const getGame = id => registry.get(id);
export const listGames = () => [...registry.values()].sort((a,b)=>a.sortOrder-b.sortOrder);
