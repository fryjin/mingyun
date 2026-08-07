import { escapeHtml } from '../../core/utils.js';
import { gameHeader } from '../../components/game-ui.js';
import { ACTIVE_RULE_LIMIT, RIGHT_LIMIT, TYPE_LABELS, requirementTags } from './rules.js';

function scoreDots(count, limit) {
  return Array.from({ length: limit }, (_, index) => `<i class="${index < count ? 'filled' : ''}"></i>`).join('');
}

function rightsChips(session, playerId) {
  const list = session.ownedRights(playerId);
  if (!list.length) return '<span class="chaos-no-right">暂无权利</span>';
  return list.map(right => `<span>${escapeHtml(right.name)}</span>`).join('');
}

export function statusHtml(session) {
  const current = session.currentPlayer();
  return `<section class="chaos-status"><div><span>当前回合</span><strong>${session.turn}</strong></div><div><span>当前玩家</span><strong>${escapeHtml(current.name)}</strong></div><div><span>生效法则</span><strong>${session.activeRules.length} / ${ACTIVE_RULE_LIMIT}</strong></div></section>
    <div class="chaos-player-board">${session.players.map(player => `<button type="button" class="${player.id === current.id ? 'current' : ''}" data-player-rights="${player.id}"><div><strong>${escapeHtml(player.name)}</strong><span class="chaos-mistakes">${scoreDots(session.mistakes.get(player.id) || 0, session.limit)}</span></div><div class="chaos-right-chips">${rightsChips(session, player.id)}</div></button>`).join('')}</div>
    ${session.lastNotice ? `<div class="chaos-notice">${escapeHtml(session.lastNotice)}</div>` : ''}
    ${session.lastMistake ? `<button type="button" class="chaos-undo" data-undo-mistake>撤销刚才为 ${escapeHtml(session.players.find(player => player.id === session.lastMistake.playerId)?.name || '玩家')} 记录的失误</button>` : ''}`;
}

export function activeRulesHtml(session, compact = false) {
  return session.activeRules.length
    ? `<section class="chaos-active-rules ${compact ? 'compact' : ''}"><header><strong>当前生效法则</strong><span>剩余数量按玩家回合计算</span></header>${session.activeRules.map((rule, index) => `<article><div><span>法则 ${index + 1} · 剩余 ${rule.remaining} 个玩家回合</span><strong>${escapeHtml(rule.instruction)}</strong>${compact ? '<small>挑战结束后可在法则面板记录违反</small>' : '<small>适用：所有玩家 · 违反：增加 1 次失误</small>'}</div>${compact ? '' : `<button type="button" data-violate="${rule.id}">记录违反</button>`}</article>`).join('')}</section>`
    : '<section class="chaos-active-rules empty"><p>当前没有持续法则。</p></section>';
}

export function renderTurn(plugin, session, challengeSeconds) {
  const player = session.currentPlayer();
  return `${gameHeader(plugin.title, `个人挑战 ${challengeSeconds} 秒 · 失误上限 ${session.limit}`)}<section class="game-stage chaos-stage">${statusHtml(session)}${activeRulesHtml(session)}<div class="chaos-turn-card"><span class="eyebrow">轮到</span><h2>${escapeHtml(player.name)}</h2><p>抽取个人挑战、持续法则或个人权利。权利仅有护盾、废除法则和转移挑战三种。</p><div class="chaos-context-actions">${session.hasRight(player.id, 'cancel-rule') && session.activeRules.length ? '<button class="button secondary full" data-use-cancel>使用“废除法则”</button>' : ''}<button class="button primary full" data-draw>抽取混乱内容</button></div></div></section>`;
}

export function renderLoading(plugin) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><div class="loading-state">正在抽取混乱内容…</div></section>`;
}

export function renderLoadError(plugin, message) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><h2>内容加载失败</h2><p>${escapeHtml(message)}</p><button class="button secondary full" data-back>返回大厅</button></section>`;
}

function contentActions({ type, needsGate, item, canTransfer, challengeSeconds }) {
  if (needsGate) return `<div class="dual-actions"><button class="button primary full" data-agree>相关玩家都同意</button>${item.alternatives?.length ? '<button class="button secondary full" data-alt>使用替代方案</button>' : ''}</div>`;
  if (type === 'challenge') return `<div class="chaos-context-actions">${canTransfer ? '<button class="button secondary full" data-transfer>使用“转移挑战”</button>' : ''}<button class="button primary full" data-start-challenge>开始 ${challengeSeconds} 秒挑战</button></div>`;
  return '<button class="button primary full" data-activate-rule>确认并让法则生效</button>';
}

export function renderContent(plugin, session, { item, type, instruction, challengeSeconds, accepted = false }) {
  const player = session.currentPlayer();
  if (type === 'right') {
    const right = item.right;
    return `${gameHeader(plugin.title, `${escapeHtml(player.name)} 的回合`)}<section class="game-stage chaos-rule-stage right">${statusHtml(session)}<div class="chaos-right-card"><span class="chaos-type">个人权利</span><h2>${escapeHtml(right.name)}</h2><dl><div><dt>什么时候使用</dt><dd>${escapeHtml(right.timing)}</dd></div><div><dt>使用后会怎样</dt><dd>${escapeHtml(right.description)}</dd></div></dl><button class="button primary full" data-collect-right>收下权利</button></div><button class="button ghost full" data-change>换一条内容</button></section>`;
  }
  const tags = requirementTags(item);
  const needsGate = !accepted && item?.consentRequired && tags.length > 0;
  const meta = type === 'persistent'
    ? `<div class="chaos-rule-meta"><span>适用：所有玩家</span><span>开始：下一位玩家</span><span>持续：${Number(item.duration || 5)} 个玩家回合</span><span>违反：增加 1 次失误</span></div>`
    : `<div class="chaos-rule-meta"><span>执行：当前玩家</span><span>时限：${challengeSeconds} 秒</span><span>失败：增加 1 次失误</span></div>`;
  return `${gameHeader(plugin.title, `${escapeHtml(player.name)} 的回合`)}<section class="game-stage chaos-rule-stage ${type}">${statusHtml(session)}${activeRulesHtml(session, true)}<div class="chaos-rule-card"><span class="chaos-type">${TYPE_LABELS[type]}</span>${tags.length ? `<div class="requirement-tags">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}<h2>${escapeHtml(instruction)}</h2>${meta}${needsGate ? '<section class="consent-gate"><strong>逐题确认</strong><p>所有相关玩家明确同意后再继续。拒绝、使用替代方案或换题都不会追加失误。</p></section>' : ''}${contentActions({ type, needsGate, item, canTransfer: session.hasRight(player.id, 'transfer'), challengeSeconds })}</div><button class="button ghost full" data-change>换一条内容</button></section>`;
}

export function renderRightReplacement(plugin, player, right, list) {
  return `${gameHeader(plugin.title, '个人权利已满')}<section class="game-stage centered chaos-right-replace"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>最多持有 ${RIGHT_LIMIT} 项权利</h2><p>选择一项旧权利进行替换，或放弃刚抽到的“${escapeHtml(right.name)}”。</p><div class="chaos-right-list">${list.map(old => `<button type="button" data-replace-right="${old.id}"><strong>${escapeHtml(old.name)}</strong><span>替换这项权利</span></button>`).join('')}</div><button class="button ghost full" data-discard-right>放弃新权利</button></section>`;
}

export function renderTransferPicker(plugin, owner, players) {
  return `${gameHeader(plugin.title, '使用“转移挑战”')}<section class="game-stage chaos-select-stage"><span class="eyebrow">${escapeHtml(owner.name)}</span><h2>谁愿意代替完成？</h2><p>被指定者需要当场明确同意；失败时由代替者增加失误。</p><div class="player-choice-grid">${players.filter(player => player.id !== owner.id).map(player => `<button type="button" data-transfer-target="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div><button class="button ghost full" data-cancel-transfer>取消</button></section>`;
}

export function renderTransferConsent(plugin, owner, target) {
  return `${gameHeader(plugin.title, '确认代替挑战')}<section class="private-stage"><span class="eyebrow">请把手机交给</span><h2>${escapeHtml(target.name)}</h2><p>你是否同意代替 ${escapeHtml(owner.name)} 完成本次挑战？失败时由你增加一次失误。</p><button class="button primary full" data-accept-transfer>我同意并开始</button><button class="button secondary full" data-decline-transfer>不同意</button></section>`;
}

export function renderChallenge(plugin, session, { player, instruction, challengeSeconds, owner }) {
  return `${gameHeader(plugin.title, `${escapeHtml(player.name)} 正在挑战`)}<section class="game-stage centered chaos-timer-stage">${activeRulesHtml(session, true)}<span class="eyebrow">个人挑战</span><h2>${escapeHtml(instruction)}</h2>${player.id !== owner.id ? `<p class="chaos-transfer-note">本题由 ${escapeHtml(player.name)} 代替 ${escapeHtml(owner.name)} 执行。</p>` : ''}<div class="chaos-countdown" data-countdown><strong>${challengeSeconds}</strong><span>秒</span></div><p data-timer-note>请在倒计时内完成任务。</p><div class="dual-actions"><button class="button secondary full" data-fail>未完成</button><button class="button primary full" data-success>已完成</button></div></section>`;
}

export function renderViolation(plugin, rule, players) {
  return `${gameHeader(plugin.title, '记录法则违反')}<section class="game-stage chaos-select-stage"><span class="eyebrow">持续法则</span><h2>${escapeHtml(rule.instruction)}</h2><p>选择一名本次违反法则的玩家。多人违反时，可分别重复记录。</p><div class="player-choice-grid">${players.map(player => `<button type="button" data-violator="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div><button class="button ghost full" data-cancel-violation>取消</button></section>`;
}

export function renderMistakeConfirm(plugin, player, source, usable) {
  return `${gameHeader(plugin.title, '记录失误前确认')}<section class="game-stage centered chaos-mistake-stage"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>即将增加 1 次失误</h2><p>来源：${source === 'rule' ? '违反持续法则' : '个人挑战失败'}</p><div class="chaos-right-list">${usable.map(right => `<button type="button" data-use-reactive="${right.id}"><strong>使用“${escapeHtml(right.name)}”</strong><span>${escapeHtml(right.description)}</span></button>`).join('')}</div><button class="button danger full" data-confirm-mistake>不使用权利，记录失误</button></section>`;
}

export function renderRightsPanel(plugin, session, player, { isCurrent, phase }) {
  const list = session.ownedRights(player.id);
  return `${gameHeader(plugin.title, '个人状态')}<section class="game-stage chaos-right-panel"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>失误 ${session.mistakes.get(player.id) || 0} / ${session.limit} · 权利 ${list.length} / ${RIGHT_LIMIT}</h2>${list.length ? `<div class="chaos-right-list">${list.map(right => `<article><strong>${escapeHtml(right.name)}</strong><dl><div><dt>使用时机</dt><dd>${escapeHtml(right.timing)}</dd></div><div><dt>使用结果</dt><dd>${escapeHtml(right.description)}</dd></div></dl>${isCurrent && phase === 'turn' && right.id === 'cancel-rule' && session.activeRules.length ? '<button class="button secondary full" data-panel-cancel>现在使用</button>' : ''}</article>`).join('')}</div>` : '<p>当前没有个人权利。抽到权利后会保存在这里，系统也会在可用时机主动提示。</p>'}<button class="button primary full" data-close-rights>返回游戏</button></section>`;
}

export function renderCancelRule(plugin, player, activeRules) {
  return `${gameHeader(plugin.title, '使用“废除法则”')}<section class="game-stage chaos-select-stage"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>选择要立即移除的法则</h2><div class="chaos-select-list">${activeRules.map(rule => `<button type="button" data-cancel-rule="${rule.id}"><span>剩余 ${rule.remaining} 个玩家回合</span><strong>${escapeHtml(rule.instruction)}</strong></button>`).join('')}</div><button class="button ghost full" data-cancel-use>取消</button></section>`;
}

export function renderTurnResult(plugin, session, message) {
  const player = session.currentPlayer();
  return `${gameHeader(plugin.title, '回合完成')}<section class="game-stage centered chaos-turn-result">${statusHtml(session)}<span class="eyebrow">本回合结果</span><h2>${escapeHtml(message)}</h2>${activeRulesHtml(session)}<div class="chaos-context-actions">${session.hasRight(player.id, 'cancel-rule') && session.activeRules.length ? '<button class="button secondary full" data-result-cancel>使用“废除法则”</button>' : ''}<button class="button primary full" data-next-turn>进入下一回合</button></div></section>`;
}

export function renderFinish(plugin, session, loser) {
  return `${gameHeader(plugin.title, '本局结束')}<section class="game-stage centered chaos-finish"><span class="eyebrow">失误达到上限</span><h2>${escapeHtml(loser.name)} 遭殃</h2><div class="chaos-player-board final">${session.players.map(player => `<div class="${player.id === loser.id ? 'loser' : ''}"><strong>${escapeHtml(player.name)}</strong><span>${session.mistakes.get(player.id) || 0} 次失误 · ${session.ownedRights(player.id).length} 项权利</span></div>`).join('')}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-restart>再来一局</button></section>`;
}
