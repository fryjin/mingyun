import { clamp, uid } from './utils.js';
const STORAGE_KEY = 'party-game-v9.1';
const memoryStorage = new Map();
const storage = (() => {
  try {
    const probe = '__party_storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return {
      getItem(key) { return memoryStorage.has(key) ? memoryStorage.get(key) : null; },
      setItem(key, value) { memoryStorage.set(key, String(value)); },
      removeItem(key) { memoryStorage.delete(key); },
      clear() { memoryStorage.clear(); }
    };
  }
})();
const defaultNames = ['薯宝','小林','阿杰','Miya','小北','七七'];
const listeners = new Set();
const fallback = {
  roomName:'周末放松局',
  players:defaultNames.map(name => ({ id:uid('player'), name, active:true })),
  settings:{ level:'standard', sound:true, haptics:true },
  gameSettings:{},
  route:{ name:'lobby', gameId:null }
};
function load() {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(fallback);
    const players = Array.isArray(saved.players) ? saved.players.slice(0,12).map((p,i)=>({id:p.id||uid('player'),name:[...String(p.name||`玩家${i+1}`)].slice(0,4).join(''),active:p.active!==false})) : fallback.players;
    while (players.length < 2) players.push({id:uid('player'),name:`玩家${players.length+1}`,active:true});
    return {...structuredClone(fallback),...saved,players,settings:{...fallback.settings,...saved.settings},gameSettings:saved.gameSettings||{},route:{name:'lobby',gameId:null}};
  } catch { return structuredClone(fallback); }
}
let state = load();
export const session = { adultAccepted:false, gameCleanup:null };
function persist() {
  const { route, ...persistable } = state;
  storage.setItem(STORAGE_KEY, JSON.stringify(persistable));
}
export function getState() { return state; }
export function setState(patch, options={persist:true}) {
  state = typeof patch === 'function' ? patch(state) : {...state,...patch};
  if (options.persist) persist();
  listeners.forEach(fn => fn(state));
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function activePlayers() { return state.players.filter(player => player.active); }
export function setRoute(name, gameId=null) { setState({...state,route:{name,gameId}},{persist:false}); }
export function setPlayers(players) { setState({...state,players:players.slice(0,12)}); }
export function resizePlayers(count) {
  count=clamp(Number(count)||2,2,12);
  const next=[...state.players];
  while(next.length<count) next.push({id:uid('player'),name:`玩家${next.length+1}`,active:true});
  setPlayers(next.slice(0,count));
}
export function updatePlayer(id, patch) { setPlayers(state.players.map(player=>player.id===id?{...player,...patch}:player)); }
export function updateSettings(patch) { setState({...state,settings:{...state.settings,...patch}}); }
export function updateGameSettings(gameId, patch) { setState({...state,gameSettings:{...state.gameSettings,[gameId]:{...(state.gameSettings[gameId]||{}),...patch}}}); }
export function startGame(gameId, settings) {
  setState({...state,gameSettings:{...state.gameSettings,[gameId]:{...(state.gameSettings[gameId]||{}),...settings}},route:{name:'game',gameId}});
}
