import { escapeHtml } from '../../core/utils.js';
import { gameHeader, privatePass } from '../../components/game-ui.js';

export function requirementTags(item) {
  const requirements = item?.requirements || {};
  const tags = [];
  if (requirements.kissing) tags.push('亲吻互动');
  else if (requirements.contact) tags.push(Number(requirements.contactLevel || 1) >= 2 ? '亲密接触' : '轻接触');
  if (requirements.alcohol) tags.push('酒水可选');
  if (requirements.pairConsent) tags.push('逐题同意');
  return tags;
}

export function renderRoundReady(plugin, round) {
  return `${gameHeader(plugin.title, `第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">重新洗牌</span><h2>查看本轮号码</h2><p>请按派对房间顺序传递手机，每个人只看自己的号码。</p><button class="button primary full" data-begin>开始查看</button></section>`;
}

export function renderPass(plugin, round, player) {
  return `${gameHeader(plugin.title, `第 ${round} 轮`)}${privatePass(player, '查看我的号码')}`;
}

export function renderNumber(plugin, player, number) {
  return `${gameHeader(plugin.title)}<section class="private-stage secret-card"><span class="eyebrow">${escapeHtml(player.name)}</span><p>你的号码</p><div class="secret-number">${number}</div><button class="button primary full" data-remember>我记住了</button></section>`;
}

export function renderNumbersComplete(plugin, round) {
  return `${gameHeader(plugin.title, `第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">号码查看完成</span><h2>准备抽国王</h2><button class="button primary full" data-king>揭晓本轮国王</button></section>`;
}

export function renderKingReveal(plugin, round, king) {
  return `${gameHeader(plugin.title, `第 ${round} 轮`)}<section class="game-stage centered king-reveal"><span class="eyebrow">本轮国王</span><div class="crown-mark">♛</div><h2>${escapeHtml(king.name)}</h2><button class="button primary full" data-task>抽取任务与号码</button></section>`;
}

export function renderTask(plugin, ctx, { round, king, instruction, targetNumbers, display, accepted = false }) {
  const tags = requirementTags(instruction);
  const needsGate = !accepted && instruction.consentRequired && tags.length > 0;
  return `${gameHeader(plugin.title, `第 ${round} 轮 · ${escapeHtml(king.name)} 是国王`)}<section class="game-stage centered"><span class="eyebrow">本轮任务${ctx.settings.level === 'adult-plus' ? ' · 成人进阶' : ''}</span><div class="target-numbers">${targetNumbers.map(number => `<span>${number}号</span>`).join('')}</div>${tags.length ? `<div class="requirement-tags">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}<p class="feature-question compact">${escapeHtml(display)}</p>${needsGate ? '<section class="consent-gate"><strong>执行玩家逐一确认</strong><p>所有相关玩家明确同意后再开始。拒绝、替代或换题都不会产生额外惩罚。</p></section>' : instruction.consentRequired ? '<p class="consent-note">所有执行玩家仍可随时停止。</p>' : ''}<p>国王直接喊号，对应玩家自行响应。</p>${needsGate ? '<button class="button primary full" data-agree>所有执行玩家都同意</button>' : ''}${needsGate && instruction.alternatives?.length ? '<button class="button secondary full" data-alt>使用替代指令</button>' : ''}<button class="button ghost full" data-change>换一条指令</button>${needsGate ? '' : '<button class="button primary full" data-complete>完成本轮</button>'}<button class="button ghost full" data-skip>跳过本轮</button></section>`;
}

export function renderRoundComplete(plugin, { round, king, targetNumbers }) {
  return `${gameHeader(plugin.title, `第 ${round} 轮完成`)}<section class="game-stage centered"><span class="eyebrow">本轮结束</span><h2>国王：${escapeHtml(king.name)}</h2><p class="result-callout">执行号码：${targetNumbers.map(number => `${number}号`).join('、') || '已跳过'}</p><button class="button primary full" data-next>重新洗牌，下一轮</button><button class="button secondary full" data-exit-round>结束游戏</button></section>`;
}

export function renderKingError(plugin, message) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(message)}</p><button class="button secondary full" data-back>返回大厅</button></section>`;
}
