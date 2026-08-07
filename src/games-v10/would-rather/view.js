import { escapeHtml } from '../../core/utils.js';
import { gameHeader, privatePass } from '../../components/game-ui.js';

export function renderWouldRatherIntro({ plugin, ctx, item }) {
  return `${gameHeader(plugin.title, '秘密选择 · 统一揭晓')}<section class="game-stage centered"><span class="eyebrow">本轮情境${ctx.settings.level === 'adult-plus' ? ' · 成人进阶' : ''}</span><h2 class="choice-question">${escapeHtml(item.question || '遇到这种情况，你会怎么选？')}</h2><div class="choice-preview"><article><small>A</small><strong>${escapeHtml(item.optionA)}</strong></article><span>或</span><article><small>B</small><strong>${escapeHtml(item.optionB)}</strong></article></div><button class="button primary full" data-start>开始选择</button></section>`;
}

export function renderWouldRatherPass({ plugin, player }) {
  return `${gameHeader(plugin.title)}${privatePass(player, '进入选择')}`;
}

export function renderWouldRatherChoice({ plugin, player, item }) {
  return `${gameHeader(plugin.title)}<section class="private-stage"><span class="eyebrow">${escapeHtml(player.name)} · 私密选择</span><h2 class="private-choice-question">${escapeHtml(item.question || '遇到这种情况，你会怎么选？')}</h2><div class="private-choice"><button data-value="A"><small>A</small><strong>${escapeHtml(item.optionA)}</strong></button><button data-value="B"><small>B</small><strong>${escapeHtml(item.optionB)}</strong></button></div></section>`;
}

export function renderWouldRatherReady(plugin) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">选择完成</span><h2>准备揭晓</h2><p>所有人的选择已经锁定。</p><button class="button primary full" data-reveal>揭晓结果</button></section>`;
}

export function renderWouldRatherResult({ plugin, item, groupA, groupB, losers }) {
  const unanimousWithoutMinority = losers.length === 0;
  const resultText = groupA.length === groupB.length
    ? '人数相同，本轮全员接受惩罚'
    : unanimousWithoutMinority
      ? '所有人选择相同，本轮没有少数派'
      : `${escapeHtml(losers.map(player => player.name).join('、'))} 接受惩罚`;
  return `${gameHeader(plugin.title)}<section class="game-stage"><span class="eyebrow">结果揭晓</span><div class="reveal-columns"><article><small>A · ${groupA.length} 人</small><h3>${escapeHtml(item.optionA)}</h3><p>${escapeHtml(groupA.map(player => player.name).join('、') || '无人选择')}</p></article><article><small>B · ${groupB.length} 人</small><h3>${escapeHtml(item.optionB)}</h3><p>${escapeHtml(groupB.map(player => player.name).join('、') || '无人选择')}</p></article></div><p class="result-callout">${resultText}</p>${unanimousWithoutMinority ? '' : '<button class="button primary full" data-punish>抽取惩罚</button>'}<button class="button secondary full" data-next>下一题</button></section>`;
}
