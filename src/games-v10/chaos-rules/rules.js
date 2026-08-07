export const RIGHT_LIMIT = 2;
export const ACTIVE_RULE_LIMIT = 3;
export const RIGHT_IDS = Object.freeze(['shield', 'cancel-rule', 'transfer']);
export const RIGHTS = Object.freeze({
  shield: Object.freeze({
    id: 'shield',
    name: '护盾',
    timing: '自己即将增加失误时',
    description: '抵消本次 1 次失误。个人挑战失败和违反持续法则时都可以使用。'
  }),
  'cancel-rule': Object.freeze({
    id: 'cancel-rule',
    name: '废除法则',
    timing: '自己的回合开始或结束时',
    description: '选择并立即移除一条当前生效的持续法则。'
  }),
  transfer: Object.freeze({
    id: 'transfer',
    name: '转移挑战',
    timing: '自己的个人挑战开始前',
    description: '指定一位明确同意的玩家代替执行；挑战结果由代替者承担。'
  })
});

export const TYPE_LABELS = Object.freeze({
  challenge: '个人挑战',
  persistent: '持续法则',
  right: '个人权利'
});

export function normalizedType(item) {
  if (['challenge', 'instant', 'event', 'global'].includes(item?.type)) return 'challenge';
  if (item?.type === 'persistent') return 'persistent';
  if (item?.type === 'privilege' || item?.type === 'right') return 'right';
  return item?.type;
}

export function requirementTags(item) {
  const requirements = item?.requirements || {};
  const tags = [];
  if (requirements.kissing) tags.push('亲吻互动');
  else if (requirements.contact) tags.push(Number(requirements.contactLevel || 1) >= 2 ? '亲密接触' : '轻接触');
  if (requirements.alcohol) tags.push('酒水可选');
  if (requirements.pairConsent) tags.push('逐题同意');
  return tags;
}

export function supportsChallengeSeconds(item, seconds) {
  if (normalizedType(item) !== 'challenge') return true;
  const supported = Array.isArray(item?.supportedSeconds) ? item.supportedSeconds.map(Number) : [3, 5, 10];
  return supported.includes(Number(seconds));
}

export function drawRightForPlayer(ownedRights, random) {
  const owned = new Set(ownedRights.map(right => right.id));
  const available = RIGHT_IDS.filter(id => !owned.has(id));
  const ids = available.length ? available : RIGHT_IDS;
  return RIGHTS[random.pick(ids)];
}
