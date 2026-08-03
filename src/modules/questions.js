import { shuffle } from '../core/utils.js';
const cache = new Map();
const pools = new Map();
const sharedFiles = {
  light:{truth:'light-truth.json',dare:'light-dare.json'},
  standard:{truth:'standard-truth.json',dare:'standard-dare.json'},
  bold:{truth:'bold-truth.json',dare:'bold-dare.json'},
  adult:{truth:'adult-truth.json',dare:'adult-dare.json'},
  'adult-plus':{truth:'adult-plus-truth.json',dare:'adult-plus-dare.json'}
};
async function fetchBank(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(path);
  if (!response.ok) throw new Error(`题库加载失败：${response.status}`);
  const bank = await response.json();
  if (bank.schemaVersion !== '1.0.0' || !Array.isArray(bank.items) || bank.count !== bank.items.length) throw new Error('题库结构校验失败');
  cache.set(path, bank);
  return bank;
}
function nextFromPool(key, items) {
  let pool=pools.get(key);
  if (!pool?.length) { pool=shuffle(items.map((_,i)=>i)); pools.set(key,pool); }
  return items[pool.pop()];
}
export function adultPlusFilterKey(preferences={}) {
  return ['contact',preferences.contact!==false?'1':'0','level',Number(preferences.contactLevel||1),'kiss',preferences.kissing?'1':'0','alcohol',preferences.alcohol?'1':'0'].join(':');
}
export function allowedByAdultPlus(item, preferences={}) {
  const requirements=item?.requirements||{};
  if (requirements.contact && preferences.contact===false) return false;
  if (requirements.contact && !requirements.kissing && Number(requirements.contactLevel||1)>Number(preferences.contactLevel||1)) return false;
  if (requirements.kissing && !preferences.kissing) return false;
  if (requirements.alcohol && !preferences.alcohol) return false;
  return true;
}
export async function drawShared(level='standard', type='truth', predicate=()=>true, poolKey='all') {
  const file=sharedFiles[level]?.[type] || sharedFiles.standard.truth;
  const path=`./data/questions/${file}`;
  const bank=await fetchBank(path);
  const eligible=bank.items.filter(predicate);
  if (!eligible.length) throw new Error('当前边界设置下没有可用题目');
  return nextFromPool(`shared:${level}:${type}:${poolKey}:${eligible.length}`,eligible);
}
export async function drawGame(gameId, level='standard', predicate=()=>true, poolKey='all') {
  const path=`./data/games/${gameId}-${level}.json`;
  const bank=await fetchBank(path);
  const eligible=bank.items.filter(predicate);
  if (!eligible.length) throw new Error('当前设置下没有可用内容');
  return nextFromPool(`game:${gameId}:${level}:${poolKey}:${eligible.length}`,eligible);
}
export function clearAdultCache() {
  [...cache.keys()].filter(key=>key.includes('adult')).forEach(key=>cache.delete(key));
  [...pools.keys()].filter(key=>key.includes('adult')).forEach(key=>pools.delete(key));
}
