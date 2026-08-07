import { escapeHtml } from '../../core/utils.js';
import { gameHeader } from '../../components/game-ui.js';

function requirementTags(item) {
  const requirements = item?.requirements || {};
  const tags = [];
  if (requirements.kissing) tags.push('亲吻互动');
  else if (requirements.contact) tags.push(Number(requirements.contactLevel || 1) >= 2 ? '亲密接触' : '轻接触');
  if (requirements.alcohol) tags.push('酒水可选');
  if (requirements.pairConsent) tags.push('逐题同意');
  return tags;
}

export function renderFiveSecondReady({ plugin, ctx, player, item, prompt, accepted }) {
  const tags = requirementTags(item);
  const needsGate = ctx.settings.level === 'adult-plus' && !accepted && item.consentRequired && tags.length > 0;
  return `${gameHeader(plugin.title, `${ctx.settings.seconds} 秒 · ${escapeHtml(player.name)}`)}<section class="game-stage centered"><span class="eyebrow">轮到${ctx.settings.level === 'adult-plus' ? ' · 成人进阶' : ''}</span><h2>${escapeHtml(player.name)}</h2>${tags.length ? `<div class="requirement-tags">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}<p class="feature-question">${escapeHtml(prompt)}</p>${needsGate ? '<section class="consent-gate"><strong>逐题确认</strong><p>所有相关玩家都明确同意后再开始。拒绝、替代或换题不会产生额外惩罚。</p></section>' : ''}${needsGate ? '<button class="button primary full" data-agree>相关玩家都同意</button>' : '<button class="button primary large" data-start>开始倒计时</button>'}${needsGate && item.alternatives?.length ? '<button class="button secondary full" data-alt>使用替代挑战</button>' : ''}<button class="button ghost full" data-change>换一道挑战</button></section>`;
}

export function renderFiveSecondCountdown({ plugin, prompt, seconds }) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><p class="feature-question compact">${escapeHtml(prompt)}</p><div class="countdown-ring"><strong data-time>${seconds}</strong><span>秒</span></div><p>时间内完成即可</p></section>`;
}

export function renderFiveSecondDecision({ plugin, prompt }) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">时间到</span><h2>挑战成功了吗？</h2><p>${escapeHtml(prompt)}</p><div class="dual-actions"><button class="button success" data-success>成功</button><button class="button danger" data-fail>失败</button></div></section>`;
}
