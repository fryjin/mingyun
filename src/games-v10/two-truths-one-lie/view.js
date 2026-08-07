import { escapeHtml } from '../../core/utils.js';
import { gameHeader, privatePass } from '../../components/game-ui.js';

const names = players => players.length ? players.map(player => escapeHtml(player.name)).join('、') : '无人';

export function renderNarratorPass(plugin, narrator, current, total) {
  return `${gameHeader(plugin.title, `第 ${current} / ${total} 位讲述者`)}${privatePass(narrator, '准备三个故事')}`;
}

export function renderComposer(plugin, narrator, prompts) {
  return `${gameHeader(plugin.title, `讲述者：${escapeHtml(narrator.name)}`)}<section class="game-stage ttol-composer-stage" data-narrator-private><span class="eyebrow">输入提示词并直接讲述</span><h2>两个真相，一个谎言</h2><p>每条只写一个用于区分故事的短提示词。填写后直接围绕提示词讲述，全部讲完再开始投票。</p><form data-prompt-form>${prompts.map((value, index) => `<label><span>故事 ${index + 1}</span><input maxlength="12" autocomplete="off" data-prompt="${index}" value="${escapeHtml(value)}" placeholder="例如：坐错高铁"></label>`).join('')}<p class="ttol-error" data-error hidden></p><button class="button primary full" type="submit">故事讲完，开始投票</button></form></section>`;
}

export function renderVotePass(plugin, player, completed, total) {
  return `${gameHeader(plugin.title, `秘密投票 · 已完成 ${completed} / ${total}`)}${privatePass(player, '开始投票')}`;
}

export function renderVote(plugin, player, prompts, current, total) {
  return `${gameHeader(plugin.title, `秘密投票 · ${current} / ${total}`)}<section class="private-stage ttol-vote-stage" data-vote-private><span class="eyebrow">${escapeHtml(player.name)}</span><h2>哪一个是谎言？</h2><p>选择后立即锁定。这里不会显示票数或其他人的选择。</p><div class="ttol-vote-options">${prompts.map((prompt, index) => `<button type="button" data-story="${index}" aria-pressed="false"><span>0${index + 1}</span><strong>${escapeHtml(prompt)}</strong></button>`).join('')}</div><button class="button primary full" data-confirm-vote disabled>确认投票</button></section>`;
}

export function renderAnswerPass(plugin, narrator) {
  return `${gameHeader(plugin.title, '投票已完成 · 结果仍然隐藏')}${privatePass(narrator, '锁定谎言并开始揭秘')}`;
}

export function renderLiePicker(plugin, narrator, prompts) {
  return `${gameHeader(plugin.title, '讲述者锁定答案')}<section class="private-stage ttol-answer-stage" data-answer-private><span class="eyebrow">${escapeHtml(narrator.name)}</span><h2>真正的谎言是哪一个？</h2><p>投票结果仍然隐藏。选择一次即可，另外两个故事会自动认定为真相。</p><div class="ttol-vote-options">${prompts.map((prompt, index) => `<button type="button" data-lie="${index}" aria-pressed="false"><span>0${index + 1}</span><strong>${escapeHtml(prompt)}</strong></button>`).join('')}</div><button class="button primary full" data-lock-lie disabled>锁定答案，开始揭秘</button></section>`;
}

function revealCard({ prompt, index, revealed, lieIndex, voters, votes, correct, wrong }) {
  const isRevealed = revealed.has(index);
  const isLie = index === lieIndex;
  if (!isRevealed) return `<button type="button" class="ttol-reveal-card pending" data-reveal="${index}"><span>0${index + 1}</span><strong>${escapeHtml(prompt)}</strong><b>点击揭晓</b></button>`;
  const voted = voters.filter(player => votes.get(player.id) === index);
  const detail = isLie
    ? `<div class="ttol-inline-results"><div><span>本轮猜对</span><strong>${names(correct)}</strong></div><div><span>本轮猜错</span><strong>${names(wrong)}</strong></div></div>`
    : `<div class="ttol-inline-votes"><span>投给这个故事</span><strong>${names(voted)}</strong><small>${voted.length ? '这些玩家已确定猜错。' : '没有人投给这个故事。'}</small></div>`;
  return `<article class="ttol-reveal-card ${isLie ? 'lie' : 'truth'}"><span>0${index + 1}</span><strong>${escapeHtml(prompt)}</strong><b>${isLie ? '谎言' : '真实'}</b>${detail}</article>`;
}

export function renderRevealBoard(plugin, { narrator, prompts, revealed, lieIndex, voters, votes, correct, wrong }) {
  const complete = revealed.size === 3;
  return `${gameHeader(plugin.title, `逐条揭秘 · ${revealed.size} / 3`)}<section class="game-stage ttol-reveal-stage"><span class="eyebrow">讲述者：${escapeHtml(narrator.name)}</span><h2>${complete ? '本轮揭秘完成' : '每次揭晓一个故事'}</h2><p>${complete ? '现在根据本轮投票直接进入惩罚。' : '点击任意未揭秘故事，结果会直接留在当前页面。'}</p><div class="ttol-reveal-board">${prompts.map((prompt, index) => revealCard({ prompt, index, revealed, lieIndex, voters, votes, correct, wrong })).join('')}</div>${complete ? `<section class="ttol-round-summary"><div><span>猜对</span><strong>${names(correct)}</strong></div><div><span>猜错</span><strong>${names(wrong)}</strong></div></section><button class="button primary full" data-settle-round>进入本轮惩罚</button>` : ''}</section>`;
}

export function renderRoundPunishment(plugin, { narrator, wrong, current, total }) {
  const allCorrect = wrong.length === 0;
  return `${gameHeader(plugin.title, `第 ${current} / ${total} 轮结算`)}<section class="game-stage centered ttol-punishment-stage"><span class="eyebrow">${allCorrect ? '全员猜对' : '讲述者成功骗人'}</span><h2>${allCorrect ? `${escapeHtml(narrator.name)} 接受惩罚` : '从猜错者中现场选一人'}</h2>${allCorrect ? '<p>所有投票者都找到了谎言，讲述者没有骗到任何人。</p>' : `<p>猜错玩家：<strong>${names(wrong)}</strong></p><div class="ttol-offline-choice"><span>由讲述者直接在线下指定其中一人</span><small>应用不随机选人，只随机抽取惩罚内容。</small></div>`}<button class="button primary full" data-draw-punishment>${allCorrect ? '为讲述者抽取惩罚' : '已经选好，抽取惩罚内容'}</button></section>`;
}

export function renderComplete(plugin) {
  return `${gameHeader(plugin.title, '全部讲述完成')}<section class="game-stage centered ttol-complete-stage"><span class="eyebrow">本局完成</span><h2>所有玩家都已讲述并完成惩罚</h2><p>本游戏不累计分数，也不再进行最终排名。</p><button class="button primary full" data-restart>再来一局</button><button class="button secondary full" data-lobby>返回大厅</button></section>`;
}
