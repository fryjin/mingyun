import { escapeHtml } from '../../core/utils.js';
import { gameHeader, privatePass } from '../../components/game-ui.js';

export function renderLoadError(plugin, message) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(message)}</p></section>`;
}

export function renderWordPass(plugin, player, adultPlus) {
  return `${gameHeader(plugin.title, adultPlus ? '私密看词 · 成人进阶' : '私密看词')}${privatePass(player, '查看我的词')}`;
}

export function renderWord(plugin, player, word) {
  return `${gameHeader(plugin.title)}<section class="private-stage secret-card word-only" data-word-private><span class="eyebrow">${escapeHtml(player.name)} 的词</span><div class="secret-word single-line">${escapeHtml(word)}</div><button class="button primary full" data-remember>我记住了</button></section>`;
}

export function renderSpeechReady(plugin, round) {
  return `${gameHeader(plugin.title, `第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">全部看完</span><h2>开始描述</h2><p>不要直接说出词。</p><button class="button primary full" data-speak>开始发言</button></section>`;
}

export function renderSpeaker(plugin, round, player, seconds) {
  return `${gameHeader(plugin.title, `第 ${round} 轮发言`)}<section class="game-stage centered"><span class="eyebrow">当前发言</span><h2>${escapeHtml(player.name)}</h2>${seconds ? `<div class="speech-timer" data-time>${seconds}</div>` : '<div class="speech-timer unlimited">∞</div>'}<button class="button primary full" data-finish>说完了</button></section>`;
}

export function renderVoteReady(plugin, round) {
  return `${gameHeader(plugin.title, `第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">发言结束</span><h2>开始投票</h2><button class="button primary full" data-vote>进入秘密投票</button></section>`;
}

export function renderVotePass(plugin, voter) {
  return `${gameHeader(plugin.title)}${privatePass(voter, '进入投票')}`;
}

export function renderVote(plugin, voter, alive) {
  return `${gameHeader(plugin.title)}<section class="private-stage" data-vote-private><span class="eyebrow">${escapeHtml(voter.name)}</span><h2>投给谁？</h2><div class="player-choice-grid">${alive.filter(player => player.id !== voter.id).map(player => `<button data-candidate="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div></section>`;
}

export function renderVoteResult(plugin, { eliminated, winner, pair }) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">投票结果</span><h2>${escapeHtml(eliminated.name)} 出局</h2>${winner ? `<h3>${winner === 'civilian' ? '相同词阵营获胜' : '不同词阵营获胜'}</h3><div class="word-pair-result"><span>${escapeHtml(pair.civilian)}</span><b>VS</b><span>${escapeHtml(pair.undercover)}</span></div><button class="button primary full" data-new>重新开局</button>` : '<p>身份暂不公开，继续下一轮。</p><button class="button primary full" data-next>下一轮</button>'}</section>`;
}
