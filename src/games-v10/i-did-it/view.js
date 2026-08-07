import { escapeHtml } from '../../core/utils.js';
import { gameHeader } from '../../components/game-ui.js';

export function renderLoading(plugin) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><div class="loading-state">正在抽取少见经历…</div></section>`;
}

export function renderLoadError(plugin, message) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><h2>题库加载失败</h2><p>${escapeHtml(message)}</p><button class="button secondary full" data-back>返回大厅</button></section>`;
}

function fingerMarks(count, initialFingers, pending = false) {
  return Array.from({ length: initialFingers }, (_, index) => {
    const active = index < count;
    const isPending = pending && index === count - 1;
    return `<i class="${active ? 'on' : ''}${isPending ? ' pending' : ''}"></i>`;
  }).join('');
}

export function renderQuestion(plugin, { initialFingers, questionNumber, question, survivors, eliminatedPlayers, fingers, selected }) {
  const confirmLabel = selected.size ? `确认：${selected.size} 人放下一指` : '确认：所有人都做过';
  const rarity = question.rarity === 'very-rare' ? '极少见经历' : question.rarity === 'rare' ? '少见经历' : '不常见经历';
  return `${gameHeader(plugin.title, `${initialFingers} 指局 · 第 ${questionNumber} 题`)}
    <section class="game-stage idi-stage">
      <div class="idi-question-card"><span>我居然做过——</span><h2>${escapeHtml(question.text)}</h2><small>${rarity}</small></div>
      <p class="idi-help">没做过的人点击自己的名字，确认后放下一根手指；做过的人不用操作。</p>
      <div class="idi-player-grid">${survivors.map(player => {
        const pending = selected.has(player.id);
        return `<button type="button" class="idi-player" data-player="${player.id}" aria-pressed="${pending}"><span class="idi-player-name">${escapeHtml(player.name)}</span><span class="idi-fingers">${fingerMarks(fingers.get(player.id), initialFingers, pending)}</span><b>${pending ? '没做过 · 放下一指' : '我做过 · 保留'}</b></button>`;
      }).join('')}</div>
      ${eliminatedPlayers.length ? `<section class="idi-eliminated"><strong>已淘汰</strong><div>${eliminatedPlayers.map(player => `<span>${escapeHtml(player.name)}</span>`).join('')}</div></section>` : ''}
      <div class="dual-actions"><button class="button secondary full" data-change>换一题</button><button class="button primary full" data-confirm>${confirmLabel}</button></div>
    </section>`;
}

export function renderQuestionResult(plugin, { questionNumber, question, didNot, did, newlyEliminated }) {
  return `${gameHeader(plugin.title, `第 ${questionNumber} 题结果`)}<section class="game-stage centered idi-result"><span class="eyebrow">本题经历</span><h2>${escapeHtml(question.text)}</h2><div class="idi-result-row"><span>没做过，放下一指</span><strong>${didNot.length ? didNot.map(player => escapeHtml(player.name)).join('、') : '无人'}</strong></div><div class="idi-result-row"><span>做过并保留</span><strong>${did.length ? did.map(player => escapeHtml(player.name)).join('、') : '无人'}</strong></div>${newlyEliminated.length ? `<p class="result-callout">本题淘汰：${newlyEliminated.map(player => escapeHtml(player.name)).join('、')}</p>` : ''}<button class="button primary full" data-next>下一题</button></section>`;
}

export function renderFinish(plugin, winner, losers, randomImmune) {
  return `${gameHeader(plugin.title, '本局结束')}<section class="game-stage centered idi-finish"><span class="eyebrow">唯一免罚</span><div class="idi-winner-mark">✦</div><h2>${escapeHtml(winner.name)}</h2><p>${randomImmune ? '剩余玩家同时归零，系统随机选出唯一免罚者。' : '坚持到最后，获得本局唯一免罚。'}</p><div class="idi-punish-list"><strong>需要逐人接受惩罚</strong><div>${losers.map(player => `<span>${escapeHtml(player.name)}</span>`).join('')}</div></div><button class="button primary full" data-punish-all>开始逐人惩罚</button><button class="button secondary full" data-restart>再来一局</button></section>`;
}

export function renderPunishmentComplete(plugin) {
  return `${gameHeader(plugin.title, '惩罚完成')}<section class="game-stage centered"><span class="eyebrow">本局完成</span><h2>所有惩罚已处理</h2><button class="button primary full" data-restart>再来一局</button><button class="button secondary full" data-lobby>返回大厅</button></section>`;
}
