import { escapeHtml } from '../../core/utils.js';
import { gameHeader, privatePass } from '../../components/game-ui.js';

export function renderIntro(plugin, ctx, prompt) {
  return `${gameHeader(plugin.title, '无主持人 · 隐藏投票')}<section class="game-stage centered"><span class="eyebrow">本轮问题${ctx.settings.level === 'adult-plus' ? ' · 成人进阶' : ''}</span><p class="feature-question">${escapeHtml(prompt.text)}</p><p>所有人看清题目后，开始逐人秘密投票。</p><button class="button primary full" data-begin>开始秘密投票</button></section>`;
}

export function renderPass(plugin, voter) {
  return `${gameHeader(plugin.title)}${privatePass(voter, '进入投票')}`;
}

export function renderVote(plugin, ctx, voter, prompt) {
  return `${gameHeader(plugin.title)}<section class="private-stage"><span class="eyebrow">${escapeHtml(voter.name)} 的秘密投票</span><h2>谁最符合？</h2><p class="private-question">${escapeHtml(prompt.text)}</p><div class="player-choice-grid">${ctx.players.map(player => `<button data-candidate="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div><button class="button ghost full" data-skip>跳过本题</button></section>`;
}

export function renderReady(plugin) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">投票完成</span><h2>所有选择均已锁定</h2><p>点击后将公开票数和玩家名单。</p><button class="button primary full" data-reveal>揭晓结果</button></section>`;
}

export function renderResult(plugin, ctx, counts, losers) {
  const maximum = Math.max(...counts.values());
  return `${gameHeader(plugin.title)}<section class="game-stage"><span class="eyebrow">揭晓结果</span><h2>${escapeHtml(losers.map(player => player.name).join('、'))} 遭殃</h2><div class="vote-results">${[...ctx.players].sort((a, b) => counts.get(b.id) - counts.get(a.id)).map(player => `<div><span>${escapeHtml(player.name)}</span><span class="vote-bar"><i style="width:${maximum ? counts.get(player.id) / maximum * 100 : 0}%"></i></span><strong>${counts.get(player.id)} 票</strong></div>`).join('')}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-next>换一道题</button></section>`;
}
