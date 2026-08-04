import { registerGame } from './registry.js';
import { adultPlusFilterKey, allowedByAdultPlus, drawGame } from '../modules/questions.js';
import { escapeHtml, randomInt, tone, vibrate } from '../core/utils.js';
import { bindExit, stageHeader } from './shared.js';

const RIGHT_LIMIT = 2;
const ACTIVE_RULE_LIMIT = 3;
const RIGHT_IDS = ['shield', 'cancel-rule', 'transfer'];
const RIGHTS = {
  shield: {
    id: 'shield',
    name: '护盾',
    timing: '自己即将增加失误时',
    description: '抵消本次 1 次失误。个人挑战失败和违反持续法则时都可以使用。'
  },
  'cancel-rule': {
    id: 'cancel-rule',
    name: '废除法则',
    timing: '自己的回合开始或结束时',
    description: '选择并立即移除一条当前生效的持续法则。'
  },
  transfer: {
    id: 'transfer',
    name: '转移挑战',
    timing: '自己的个人挑战开始前',
    description: '指定一位明确同意的玩家代替执行；挑战结果由代替者承担。'
  }
};

const typeLabels = {
  challenge: '个人挑战',
  persistent: '持续法则',
  right: '个人权利'
};

function normalizedType(item) {
  if (['challenge', 'instant', 'event', 'global'].includes(item?.type)) return 'challenge';
  if (item?.type === 'persistent') return 'persistent';
  if (item?.type === 'privilege') return 'right';
  return item?.type;
}

function requirementTags(item) {
  const requirements = item?.requirements || {};
  const tags = [];
  if (requirements.kissing) tags.push('亲吻互动');
  else if (requirements.contact) tags.push(Number(requirements.contactLevel || 1) >= 2 ? '亲密接触' : '轻接触');
  if (requirements.alcohol) tags.push('酒水可选');
  if (requirements.pairConsent) tags.push('逐题同意');
  return tags;
}

const plugin = {
  id: 'chaos-rules',
  title: '混乱法则',
  sortOrder: 2.1,
  icon: 'chaos',
  color: '#b2788e',
  minPlayers: 3,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '10–25 分钟',
  shortDescription: '挑战、法则和权利持续叠加，先失误到上限的人遭殃。',
  description: '玩家轮流抽取个人挑战、持续法则或个人权利。个人权利只包含护盾、废除法则和转移挑战，并会在对应时机主动提示。',
  phoneMode: '按玩家顺序轮流共用',
  resultMode: '首位达到失误上限者受罚',
  defaultSettings: { mistakeLimit: 3, challengeSeconds: 5, level: 'standard' },
  renderSetup(settings) {
    const seconds = [3, 5, 10].includes(Number(settings.challengeSeconds)) ? Number(settings.challengeSeconds) : 5;
    return `<div class="setting-block"><div class="setting-label"><span>失误上限</span><small>达到后立即结算</small></div><div class="segmented" data-limit>${[2, 3, 5].map(value => `<button type="button" data-segment data-value="${value}" class="${Number(settings.mistakeLimit || 3) === value ? 'active' : ''}">${value} 次</button>`).join('')}</div></div><div class="setting-block"><div class="setting-label"><span>个人挑战时间</span><small>倒计时结束后由现场确认</small></div><div class="segmented" data-seconds>${[3, 5, 10].map(value => `<button type="button" data-segment data-value="${value}" class="${seconds === value ? 'active' : ''}">${value} 秒</button>`).join('')}</div></div>`;
  },
  readSetup(sheet) {
    return {
      mistakeLimit: Number(sheet.querySelector('[data-limit] .active')?.dataset.value || 3),
      challengeSeconds: Number(sheet.querySelector('[data-seconds] .active')?.dataset.value || 5)
    };
  },
  async mount(root, ctx) {
    const limit = [2, 3, 5].includes(Number(ctx.settings.mistakeLimit)) ? Number(ctx.settings.mistakeLimit) : 3;
    const challengeSeconds = [3, 5, 10].includes(Number(ctx.settings.challengeSeconds)) ? Number(ctx.settings.challengeSeconds) : 5;

    let currentIndex = 0;
    let turn = 1;
    let mistakes = new Map(ctx.players.map(player => [player.id, 0]));
    let rights = new Map(ctx.players.map(player => [player.id, []]));
    let activeRules = [];
    let currentItem = null;
    let currentOverride = '';
    let challengePlayer = null;
    let loading = false;
    let countdownId = null;
    let phase = 'turn';
    let lastNotice = '';
    let lastMistake = null;

    const currentPlayer = () => ctx.players[currentIndex];
    const currentType = () => normalizedType(currentItem);
    const scoreDots = count => Array.from({ length: limit }, (_, index) => `<i class="${index < count ? 'filled' : ''}"></i>`).join('');
    const clearCountdown = () => {
      if (countdownId !== null) {
        clearInterval(countdownId);
        countdownId = null;
      }
    };
    ctx.onCleanup(clearCountdown);

    const ownedRights = playerId => rights.get(playerId) || [];
    const hasRight = (playerId, rightId) => ownedRights(playerId).some(right => right.id === rightId);
    const consumeRight = (playerId, rightId) => {
      const list = ownedRights(playerId);
      const index = list.findIndex(right => right.id === rightId);
      if (index < 0) return false;
      const next = [...list];
      next.splice(index, 1);
      rights.set(playerId, next);
      return true;
    };

    const rightsChips = playerId => {
      const list = ownedRights(playerId);
      if (!list.length) return '<span class="chaos-no-right">暂无权利</span>';
      return list.map(right => `<span>${escapeHtml(right.name)}</span>`).join('');
    };

    const statusHtml = () => `<section class="chaos-status"><div><span>当前回合</span><strong>${turn}</strong></div><div><span>当前玩家</span><strong>${escapeHtml(currentPlayer().name)}</strong></div><div><span>生效法则</span><strong>${activeRules.length} / ${ACTIVE_RULE_LIMIT}</strong></div></section>
      <div class="chaos-player-board">${ctx.players.map(player => `<button type="button" class="${player.id === currentPlayer().id ? 'current' : ''}" data-player-rights="${player.id}"><div><strong>${escapeHtml(player.name)}</strong><span class="chaos-mistakes">${scoreDots(mistakes.get(player.id) || 0)}</span></div><div class="chaos-right-chips">${rightsChips(player.id)}</div></button>`).join('')}</div>
      ${lastNotice ? `<div class="chaos-notice">${escapeHtml(lastNotice)}</div>` : ''}
      ${lastMistake ? `<button type="button" class="chaos-undo" data-undo-mistake>撤销刚才为 ${escapeHtml(ctx.players.find(player => player.id === lastMistake.playerId)?.name || '玩家')} 记录的失误</button>` : ''}`;

    const activeRulesHtml = (compact = false) => activeRules.length
      ? `<section class="chaos-active-rules ${compact ? 'compact' : ''}"><header><strong>当前生效法则</strong><span>剩余数量按玩家回合计算</span></header>${activeRules.map((rule, index) => `<article><div><span>法则 ${index + 1} · 剩余 ${rule.remaining} 个玩家回合</span><strong>${escapeHtml(rule.instruction)}</strong>${compact ? '<small>挑战结束后可在法则面板记录违反</small>' : `<small>适用：所有玩家 · 违反：增加 1 次失误</small>`}</div>${compact ? '' : `<button type="button" data-violate="${rule.id}">记录违反</button>`}</article>`).join('')}</section>`
      : `<section class="chaos-active-rules empty"><p>当前没有持续法则。</p></section>`;

    const bindCommon = (returnFn = renderTurn) => {
      bindExit(root, ctx);
      root.querySelectorAll('[data-violate]').forEach(button => {
        button.onclick = () => renderViolation(button.dataset.violate, returnFn);
      });
      root.querySelectorAll('[data-player-rights]').forEach(button => {
        button.onclick = () => renderRightsPanel(button.dataset.playerRights, returnFn);
      });
      root.querySelector('[data-undo-mistake]')?.addEventListener('click', () => {
        if (!lastMistake) return;
        mistakes.set(lastMistake.playerId, lastMistake.previous);
        lastNotice = '已撤销上一条失误记录。';
        lastMistake = null;
        returnFn();
      });
    };

    const renderTurn = () => {
      clearCountdown();
      phase = 'turn';
      challengePlayer = null;
      root.innerHTML = `${stageHeader(plugin.title, `个人挑战 ${challengeSeconds} 秒 · 失误上限 ${limit}`)}<section class="game-stage chaos-stage">${statusHtml()}${activeRulesHtml()}<div class="chaos-turn-card"><span class="eyebrow">轮到</span><h2>${escapeHtml(currentPlayer().name)}</h2><p>抽取个人挑战、持续法则或个人权利。权利仅有护盾、废除法则和转移挑战三种。</p><div class="chaos-context-actions">${hasRight(currentPlayer().id, 'cancel-rule') && activeRules.length ? '<button class="button secondary full" data-use-cancel>使用“废除法则”</button>' : ''}<button class="button primary full" data-draw>抽取混乱内容</button></div></div></section>`;
      bindCommon(renderTurn);
      root.querySelector('[data-draw]').onclick = drawContent;
      root.querySelector('[data-use-cancel]')?.addEventListener('click', () => useCancelRule(currentPlayer(), renderTurn));
    };

    const supportsCurrentTime = item => {
      if (normalizedType(item) !== 'challenge') return true;
      const supported = Array.isArray(item.supportedSeconds) ? item.supportedSeconds.map(Number) : [3, 5, 10];
      return supported.includes(challengeSeconds);
    };

    const drawSystemRight = () => {
      const player = currentPlayer();
      const owned = new Set(ownedRights(player.id).map(right => right.id));
      const available = RIGHT_IDS.filter(id => !owned.has(id));
      const id = available.length ? available[randomInt(0, available.length - 1)] : RIGHT_IDS[randomInt(0, RIGHT_IDS.length - 1)];
      currentItem = { type: 'right', right: RIGHTS[id], instruction: RIGHTS[id].name };
      currentOverride = '';
      renderContent();
    };

    const drawContent = async () => {
      if (loading) return;
      loading = true;
      lastNotice = '';
      lastMistake = null;
      clearCountdown();
      root.innerHTML = `${stageHeader(plugin.title)}<section class="game-stage centered"><div class="loading-state">正在抽取混乱内容…</div></section>`;
      bindExit(root, ctx);
      try {
        if (randomInt(1, 100) <= 15) {
          drawSystemRight();
          return;
        }
        const prefs = ctx.settings.adultPlus || {};
        const predicate = item => {
          const type = normalizedType(item);
          if (!['challenge', 'persistent'].includes(type)) return false;
          if (!supportsCurrentTime(item)) return false;
          return ctx.settings.level !== 'adult-plus' || allowedByAdultPlus(item, prefs);
        };
        const boundaryKey = ctx.settings.level === 'adult-plus' ? adultPlusFilterKey(prefs) : 'all';
        currentItem = await drawGame(plugin.id, ctx.settings.level, predicate, `${boundaryKey}:v934:${challengeSeconds}`);
        currentOverride = '';
        renderContent();
      } catch (error) {
        root.innerHTML = `${stageHeader(plugin.title)}<section class="game-stage centered"><h2>内容加载失败</h2><p>${escapeHtml(error.message)}</p><button class="button secondary full" data-back>返回大厅</button></section>`;
        bindExit(root, ctx);
        root.querySelector('[data-back]').onclick = ctx.goLobby;
      } finally {
        loading = false;
      }
    };

    const renderContent = (accepted = false) => {
      phase = 'card';
      const type = currentType();
      const item = currentItem;
      const tags = requirementTags(item);
      const needsGate = !accepted && item?.consentRequired && tags.length;
      const instruction = currentOverride || item.instruction;

      if (type === 'right') {
        const right = item.right;
        root.innerHTML = `${stageHeader(plugin.title, `${escapeHtml(currentPlayer().name)} 的回合`)}<section class="game-stage chaos-rule-stage right">${statusHtml()}<div class="chaos-right-card"><span class="chaos-type">个人权利</span><h2>${escapeHtml(right.name)}</h2><dl><div><dt>什么时候使用</dt><dd>${escapeHtml(right.timing)}</dd></div><div><dt>使用后会怎样</dt><dd>${escapeHtml(right.description)}</dd></div></dl><button class="button primary full" data-collect-right>收下权利</button></div><button class="button ghost full" data-change>换一条内容</button></section>`;
        bindCommon(() => renderContent());
        root.querySelector('[data-collect-right]').onclick = () => collectRight(right);
        root.querySelector('[data-change]').onclick = drawContent;
        return;
      }

      const meta = type === 'persistent'
        ? `<div class="chaos-rule-meta"><span>适用：所有玩家</span><span>开始：下一位玩家</span><span>持续：${Number(item.duration || 5)} 个玩家回合</span><span>违反：增加 1 次失误</span></div>`
        : `<div class="chaos-rule-meta"><span>执行：当前玩家</span><span>时限：${challengeSeconds} 秒</span><span>失败：增加 1 次失误</span></div>`;

      root.innerHTML = `${stageHeader(plugin.title, `${escapeHtml(currentPlayer().name)} 的回合`)}<section class="game-stage chaos-rule-stage ${type}">${statusHtml()}${activeRulesHtml(true)}<div class="chaos-rule-card"><span class="chaos-type">${typeLabels[type]}</span>${tags.length ? `<div class="requirement-tags">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}<h2>${escapeHtml(instruction)}</h2>${meta}${needsGate ? '<section class="consent-gate"><strong>逐题确认</strong><p>所有相关玩家明确同意后再继续。拒绝、使用替代方案或换题都不会追加失误。</p></section>' : ''}${contentActions(type, needsGate, item)}</div><button class="button ghost full" data-change>换一条内容</button></section>`;
      bindCommon(() => renderContent(accepted));
      root.querySelector('[data-change]').onclick = drawContent;
      root.querySelector('[data-agree]')?.addEventListener('click', () => renderContent(true));
      root.querySelector('[data-alt]')?.addEventListener('click', () => {
        currentOverride = item.alternatives?.[0] || item.instruction;
        renderContent(true);
      });
      root.querySelector('[data-start-challenge]')?.addEventListener('click', () => startChallenge(currentPlayer()));
      root.querySelector('[data-transfer]')?.addEventListener('click', renderTransferPicker);
      root.querySelector('[data-activate-rule]')?.addEventListener('click', activatePersistentRule);
    };

    const contentActions = (type, needsGate, item) => {
      if (needsGate) {
        return `<div class="dual-actions"><button class="button primary full" data-agree>相关玩家都同意</button>${item.alternatives?.length ? '<button class="button secondary full" data-alt>使用替代方案</button>' : ''}</div>`;
      }
      if (type === 'challenge') {
        return `<div class="chaos-context-actions">${hasRight(currentPlayer().id, 'transfer') ? '<button class="button secondary full" data-transfer>使用“转移挑战”</button>' : ''}<button class="button primary full" data-start-challenge>开始 ${challengeSeconds} 秒挑战</button></div>`;
      }
      return '<button class="button primary full" data-activate-rule>确认并让法则生效</button>';
    };

    const collectRight = right => {
      const player = currentPlayer();
      const list = ownedRights(player.id);
      if (list.some(item => item.id === right.id)) {
        lastNotice = `${player.name} 已经拥有“${right.name}”，本次改为重新抽取。`;
        drawContent();
        return;
      }
      if (list.length < RIGHT_LIMIT) {
        rights.set(player.id, [...list, right]);
        renderTurnResult(`${player.name} 获得“${right.name}”`);
        return;
      }
      root.innerHTML = `${stageHeader(plugin.title, '个人权利已满')}<section class="game-stage centered chaos-right-replace"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>最多持有 ${RIGHT_LIMIT} 项权利</h2><p>选择一项旧权利进行替换，或放弃刚抽到的“${escapeHtml(right.name)}”。</p><div class="chaos-right-list">${list.map(old => `<button type="button" data-replace-right="${old.id}"><strong>${escapeHtml(old.name)}</strong><span>替换这项权利</span></button>`).join('')}</div><button class="button ghost full" data-discard-right>放弃新权利</button></section>`;
      bindExit(root, ctx);
      root.querySelectorAll('[data-replace-right]').forEach(button => {
        button.onclick = () => {
          rights.set(player.id, list.map(old => old.id === button.dataset.replaceRight ? right : old));
          renderTurnResult(`${player.name} 保留了“${right.name}”`);
        };
      });
      root.querySelector('[data-discard-right]').onclick = () => renderTurnResult(`${player.name} 放弃了“${right.name}”`);
    };

    const activatePersistentRule = () => {
      const item = currentItem;
      const instruction = currentOverride || item.instruction;
      const conflictGroup = item.conflictGroup || '';
      let replaced = '';
      if (conflictGroup) {
        const conflict = activeRules.find(rule => rule.conflictGroup === conflictGroup);
        if (conflict) {
          replaced = conflict.instruction;
          activeRules = activeRules.filter(rule => rule.id !== conflict.id);
        }
      }
      if (activeRules.length >= ACTIVE_RULE_LIMIT) {
        const oldest = activeRules.shift();
        replaced = replaced || oldest.instruction;
      }
      activeRules.push({
        id: `rule-${Date.now()}-${randomInt(100, 999)}`,
        instruction,
        trigger: item.trigger || '',
        action: item.action || '',
        conflictGroup,
        remaining: Number(item.duration || 5),
        fresh: true
      });
      renderTurnResult(replaced ? `新法则已生效，并替换“${replaced}”` : '新法则将从下一位玩家开始生效');
    };

    const renderTransferPicker = () => {
      const owner = currentPlayer();
      const available = ctx.players.filter(player => player.id !== owner.id);
      root.innerHTML = `${stageHeader(plugin.title, '使用“转移挑战”')}<section class="game-stage chaos-select-stage"><span class="eyebrow">${escapeHtml(owner.name)}</span><h2>谁愿意代替完成？</h2><p>被指定者需要当场明确同意；失败时由代替者增加失误。</p><div class="player-choice-grid">${available.map(player => `<button type="button" data-transfer-target="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div><button class="button ghost full" data-cancel-transfer>取消</button></section>`;
      bindExit(root, ctx);
      root.querySelector('[data-cancel-transfer]').onclick = () => renderContent(true);
      root.querySelectorAll('[data-transfer-target]').forEach(button => {
        button.onclick = () => {
          const target = ctx.players.find(player => player.id === button.dataset.transferTarget);
          renderTransferConsent(target);
        };
      });
    };

    const renderTransferConsent = target => {
      root.innerHTML = `${stageHeader(plugin.title, '确认代替挑战')}<section class="private-stage"><span class="eyebrow">请把手机交给</span><h2>${escapeHtml(target.name)}</h2><p>你是否同意代替 ${escapeHtml(currentPlayer().name)} 完成本次挑战？失败时由你增加一次失误。</p><button class="button primary full" data-accept-transfer>我同意并开始</button><button class="button secondary full" data-decline-transfer>不同意</button></section>`;
      bindExit(root, ctx);
      root.querySelector('[data-decline-transfer]').onclick = () => renderContent(true);
      root.querySelector('[data-accept-transfer]').onclick = () => {
        consumeRight(currentPlayer().id, 'transfer');
        startChallenge(target);
      };
    };

    const startChallenge = player => {
      clearCountdown();
      phase = 'challenge';
      challengePlayer = player;
      let remaining = challengeSeconds;
      const instruction = currentOverride || currentItem.instruction;
      root.innerHTML = `${stageHeader(plugin.title, `${escapeHtml(player.name)} 正在挑战`)}<section class="game-stage centered chaos-timer-stage">${activeRulesHtml(true)}<span class="eyebrow">个人挑战</span><h2>${escapeHtml(instruction)}</h2>${player.id !== currentPlayer().id ? `<p class="chaos-transfer-note">本题由 ${escapeHtml(player.name)} 代替 ${escapeHtml(currentPlayer().name)} 执行。</p>` : ''}<div class="chaos-countdown" data-countdown><strong>${remaining}</strong><span>秒</span></div><p data-timer-note>请在倒计时内完成任务。</p><div class="dual-actions"><button class="button secondary full" data-fail>未完成</button><button class="button primary full" data-success>已完成</button></div></section>`;
      bindCommon(() => startChallenge(player));
      root.querySelector('[data-fail]').onclick = renderChallengeFailure;
      root.querySelector('[data-success]').onclick = () => {
        clearCountdown();
        renderTurnResult(`${player.name} 完成了个人挑战`);
      };
      tone(330, 0.045, ctx.global.sound, 0.018);
      countdownId = setInterval(() => {
        remaining -= 1;
        const number = root.querySelector('[data-countdown] strong');
        if (number) number.textContent = String(Math.max(0, remaining));
        if (remaining > 0) {
          tone(250 + remaining * 18, 0.035, ctx.global.sound, 0.012);
          return;
        }
        clearCountdown();
        root.querySelector('[data-countdown]')?.classList.add('expired');
        const note = root.querySelector('[data-timer-note]');
        if (note) note.textContent = '时间到，请现场确认是否完成。';
        vibrate([30, 30, 45], ctx.global.haptics);
      }, 1000);
    };

    const renderChallengeFailure = () => {
      clearCountdown();
      const player = challengePlayer || currentPlayer();
      resolveMistake(player, 'challenge', () => renderTurnResult(`${player.name} 挑战失败`));
    };

    const renderViolation = (ruleId, returnFn) => {
      const rule = activeRules.find(item => item.id === ruleId);
      if (!rule) {
        returnFn();
        return;
      }
      root.innerHTML = `${stageHeader(plugin.title, '记录法则违反')}<section class="game-stage chaos-select-stage"><span class="eyebrow">持续法则</span><h2>${escapeHtml(rule.instruction)}</h2><p>选择一名本次违反法则的玩家。多人违反时，可分别重复记录。</p><div class="player-choice-grid">${ctx.players.map(player => `<button type="button" data-violator="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div><button class="button ghost full" data-cancel-violation>取消</button></section>`;
      bindExit(root, ctx);
      root.querySelector('[data-cancel-violation]').onclick = returnFn;
      root.querySelectorAll('[data-violator]').forEach(button => {
        button.onclick = () => {
          const player = ctx.players.find(item => item.id === button.dataset.violator);
          resolveMistake(player, 'rule', returnFn);
        };
      });
    };

    const resolveMistake = (player, source, onDone) => {
      const usable = [];
      if (hasRight(player.id, 'shield')) usable.push(RIGHTS.shield);
      if (!usable.length) {
        recordMistake(player, source, onDone);
        return;
      }
      root.innerHTML = `${stageHeader(plugin.title, '记录失误前确认')}<section class="game-stage centered chaos-mistake-stage"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>即将增加 1 次失误</h2><p>来源：${source === 'rule' ? '违反持续法则' : '个人挑战失败'}</p><div class="chaos-right-list">${usable.map(right => `<button type="button" data-use-reactive="${right.id}"><strong>使用“${escapeHtml(right.name)}”</strong><span>${escapeHtml(right.description)}</span></button>`).join('')}</div><button class="button danger full" data-confirm-mistake>不使用权利，记录失误</button></section>`;
      bindExit(root, ctx);
      root.querySelectorAll('[data-use-reactive]').forEach(button => {
        button.onclick = () => {
          const right = RIGHTS[button.dataset.useReactive];
          consumeRight(player.id, right.id);
          lastNotice = `${player.name} 使用“${right.name}”，本次失误已取消。`;
          lastMistake = null;
          onDone();
        };
      });
      root.querySelector('[data-confirm-mistake]').onclick = () => recordMistake(player, source, onDone);
    };

    const recordMistake = (player, source, onDone) => {
      const previous = mistakes.get(player.id) || 0;
      const next = previous + 1;
      mistakes.set(player.id, next);
      lastMistake = { playerId: player.id, previous, source };
      lastNotice = `${player.name} 增加 1 次失误。`;
      if (next >= limit) {
        finish(player);
        return;
      }
      onDone();
    };

    const renderRightsPanel = (playerId, returnFn) => {
      const player = ctx.players.find(item => item.id === playerId);
      const list = ownedRights(playerId);
      const isCurrent = playerId === currentPlayer().id;
      root.innerHTML = `${stageHeader(plugin.title, '个人状态')}<section class="game-stage chaos-right-panel"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>失误 ${mistakes.get(playerId) || 0} / ${limit} · 权利 ${list.length} / ${RIGHT_LIMIT}</h2>${list.length ? `<div class="chaos-right-list">${list.map(right => `<article><strong>${escapeHtml(right.name)}</strong><dl><div><dt>使用时机</dt><dd>${escapeHtml(right.timing)}</dd></div><div><dt>使用结果</dt><dd>${escapeHtml(right.description)}</dd></div></dl>${isCurrent && phase === 'turn' && right.id === 'cancel-rule' && activeRules.length ? '<button class="button secondary full" data-panel-cancel>现在使用</button>' : ''}</article>`).join('')}</div>` : '<p>当前没有个人权利。抽到权利后会保存在这里，系统也会在可用时机主动提示。</p>'}<button class="button primary full" data-close-rights>返回游戏</button></section>`;
      bindExit(root, ctx);
      root.querySelector('[data-close-rights]').onclick = returnFn;
      root.querySelector('[data-panel-cancel]')?.addEventListener('click', () => useCancelRule(player, returnFn));
    };

    const useCancelRule = (player, returnFn) => {
      if (!hasRight(player.id, 'cancel-rule') || !activeRules.length) {
        returnFn();
        return;
      }
      root.innerHTML = `${stageHeader(plugin.title, '使用“废除法则”')}<section class="game-stage chaos-select-stage"><span class="eyebrow">${escapeHtml(player.name)}</span><h2>选择要立即移除的法则</h2><div class="chaos-select-list">${activeRules.map(rule => `<button type="button" data-cancel-rule="${rule.id}"><span>剩余 ${rule.remaining} 个玩家回合</span><strong>${escapeHtml(rule.instruction)}</strong></button>`).join('')}</div><button class="button ghost full" data-cancel-use>取消</button></section>`;
      bindExit(root, ctx);
      root.querySelector('[data-cancel-use]').onclick = returnFn;
      root.querySelectorAll('[data-cancel-rule]').forEach(button => {
        button.onclick = () => {
          const removed = activeRules.find(rule => rule.id === button.dataset.cancelRule);
          activeRules = activeRules.filter(rule => rule.id !== button.dataset.cancelRule);
          consumeRight(player.id, 'cancel-rule');
          lastNotice = `${player.name} 废除了“${removed?.instruction || '一条持续法则'}”。`;
          returnFn();
        };
      });
    };

    const renderTurnResult = message => {
      clearCountdown();
      phase = 'result';
      const player = currentPlayer();
      root.innerHTML = `${stageHeader(plugin.title, '回合完成')}<section class="game-stage centered chaos-turn-result">${statusHtml()}<span class="eyebrow">本回合结果</span><h2>${escapeHtml(message)}</h2>${activeRulesHtml()}<div class="chaos-context-actions">${hasRight(player.id, 'cancel-rule') && activeRules.length ? '<button class="button secondary full" data-result-cancel>使用“废除法则”</button>' : ''}<button class="button primary full" data-next-turn>进入下一回合</button></div></section>`;
      bindCommon(() => renderTurnResult(message));
      root.querySelector('[data-result-cancel]')?.addEventListener('click', () => useCancelRule(player, () => renderTurnResult(message)));
      root.querySelector('[data-next-turn]').onclick = advanceTurn;
    };

    const advanceTurn = () => {
      const expired = [];
      activeRules = activeRules.map(rule => {
        if (rule.fresh) return { ...rule, fresh: false };
        const remaining = rule.remaining - 1;
        if (remaining <= 0) expired.push(rule.instruction);
        return { ...rule, remaining };
      }).filter(rule => rule.remaining > 0);

      currentIndex = (currentIndex + 1) % ctx.players.length;
      turn += 1;
      currentItem = null;
      currentOverride = '';
      challengePlayer = null;
      lastMistake = null;
      if (expired.length) lastNotice = `持续法则已到期：${expired.join('、')}`;
      renderTurn();
    };

    const finish = loser => {
      clearCountdown();
      phase = 'final';
      root.innerHTML = `${stageHeader(plugin.title, '本局结束')}<section class="game-stage centered chaos-finish"><span class="eyebrow">失误达到上限</span><h2>${escapeHtml(loser.name)} 遭殃</h2><div class="chaos-player-board final">${ctx.players.map(player => `<div class="${player.id === loser.id ? 'loser' : ''}"><strong>${escapeHtml(player.name)}</strong><span>${mistakes.get(player.id) || 0} 次失误 · ${ownedRights(player.id).length} 项权利</span></div>`).join('')}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-restart>再来一局</button></section>`;
      bindExit(root, ctx);
      root.querySelector('[data-punish]').onclick = () => ctx.punishment([loser], { onDone: reset });
      root.querySelector('[data-restart]').onclick = reset;
    };

    const reset = () => {
      clearCountdown();
      currentIndex = 0;
      turn = 1;
      mistakes = new Map(ctx.players.map(player => [player.id, 0]));
      rights = new Map(ctx.players.map(player => [player.id, []]));
      activeRules = [];
      currentItem = null;
      currentOverride = '';
      challengePlayer = null;
      loading = false;
      phase = 'turn';
      lastNotice = '';
      lastMistake = null;
      renderTurn();
    };

    renderTurn();
  }
};

registerGame(plugin);
export default plugin;
