import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { TimerController } from '../../engine/timer.js';
import { bindPageVisibility } from '../../engine/visibility.js';
import { questionEngine } from '../../data-engine/question-engine.js';
import { tone, vibrate } from '../../core/utils.js';
import { bindGameExit } from '../../components/game-ui.js';
import { ChaosSession } from './session.js';
import { drawRightForPlayer, normalizedType, RIGHTS, supportsChallengeSeconds } from './rules.js';
import {
  renderCancelRule,
  renderChallenge,
  renderContent,
  renderFinish,
  renderLoadError,
  renderLoading,
  renderMistakeConfirm,
  renderRightReplacement,
  renderRightsPanel,
  renderTransferConsent,
  renderTransferPicker,
  renderTurn,
  renderTurnResult,
  renderViolation
} from './view.js';

const plugin = createGamePlugin({
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
  mount(root, ctx) {
    const limit = [2, 3, 5].includes(Number(ctx.settings.mistakeLimit)) ? Number(ctx.settings.mistakeLimit) : 3;
    const challengeSeconds = [3, 5, 10].includes(Number(ctx.settings.challengeSeconds)) ? Number(ctx.settings.challengeSeconds) : 5;
    const session = new ChaosSession(ctx.players, { limit });
    let currentItem = null;
    let currentOverride = '';
    let challengePlayer = null;
    let loading = false;
    let challengeTimer = null;
    let challengePausedByVisibility = false;
    let phase = 'turn';

    const bind = () => bindGameExit(root, ctx);
    const currentType = () => normalizedType(currentItem);
    const instructionText = () => currentOverride || currentItem?.instruction || '';

    const clearChallengeTimer = () => {
      challengeTimer?.cancel();
      challengeTimer = null;
      challengePausedByVisibility = false;
    };
    ctx.lifecycle.add(clearChallengeTimer);

    const bindCommon = (returnFn = showTurn) => {
      bind();
      root.querySelectorAll('[data-violate]').forEach(button => {
        button.onclick = () => showViolation(button.dataset.violate, returnFn);
      });
      root.querySelectorAll('[data-player-rights]').forEach(button => {
        button.onclick = () => showRightsPanel(button.dataset.playerRights, returnFn);
      });
      root.querySelector('[data-undo-mistake]')?.addEventListener('click', () => {
        if (!session.undoLastMistake()) return;
        returnFn();
      });
    };

    const showTurn = () => {
      clearChallengeTimer();
      phase = 'turn';
      challengePlayer = null;
      root.innerHTML = renderTurn(plugin, session, challengeSeconds);
      bindCommon(showTurn);
      root.querySelector('[data-draw]').onclick = drawContent;
      root.querySelector('[data-use-cancel]')?.addEventListener('click', () => useCancelRule(session.currentPlayer(), showTurn));
    };

    const drawSystemRight = () => {
      const right = drawRightForPlayer(session.ownedRights(session.currentPlayer().id), ctx.services.random);
      currentItem = { type: 'right', right, instruction: right.name };
      currentOverride = '';
      showContent();
    };

    const drawContent = async () => {
      if (loading) return;
      loading = true;
      session.lastNotice = '';
      session.lastMistake = null;
      clearChallengeTimer();
      phase = 'loading';
      root.innerHTML = renderLoading(plugin);
      bind();
      try {
        if (ctx.services.random.int(1, 100) <= 15) {
          drawSystemRight();
          return;
        }
        currentItem = await questionEngine.drawGame({
          gameId: plugin.id,
          settings: ctx.settings,
          predicate: item => ['challenge', 'persistent'].includes(normalizedType(item)) && supportsChallengeSeconds(item, challengeSeconds),
          poolKeySuffix: `v934:${challengeSeconds}`
        });
        if (ctx.lifecycle.disposed) return;
        currentOverride = '';
        showContent();
      } catch (error) {
        if (ctx.lifecycle.disposed) return;
        root.innerHTML = renderLoadError(plugin, error.message);
        bind();
        root.querySelector('[data-back]').onclick = ctx.goLobby;
      } finally {
        loading = false;
      }
    };

    const showContent = (accepted = false) => {
      phase = 'card';
      const type = currentType();
      root.innerHTML = renderContent(plugin, session, {
        item: currentItem,
        type,
        instruction: instructionText(),
        challengeSeconds,
        accepted
      });
      bindCommon(() => showContent(accepted));
      root.querySelector('[data-change]').onclick = drawContent;
      root.querySelector('[data-agree]')?.addEventListener('click', () => showContent(true));
      root.querySelector('[data-alt]')?.addEventListener('click', () => {
        currentOverride = currentItem.alternatives?.[0] || currentItem.instruction;
        showContent(true);
      });
      root.querySelector('[data-start-challenge]')?.addEventListener('click', () => startChallenge(session.currentPlayer()));
      root.querySelector('[data-transfer]')?.addEventListener('click', showTransferPicker);
      root.querySelector('[data-activate-rule]')?.addEventListener('click', activatePersistentRule);
      root.querySelector('[data-collect-right]')?.addEventListener('click', () => collectRight(currentItem.right));
    };

    const collectRight = right => {
      const player = session.currentPlayer();
      const result = session.collectRight(player.id, right);
      if (result.status === 'duplicate') {
        session.lastNotice = `${player.name} 已经拥有“${right.name}”，本次改为重新抽取。`;
        drawContent();
        return;
      }
      if (result.status === 'added') {
        showTurnResult(`${player.name} 获得“${right.name}”`);
        return;
      }
      phase = 'panel';
      root.innerHTML = renderRightReplacement(plugin, player, right, result.list);
      bind();
      root.querySelectorAll('[data-replace-right]').forEach(button => {
        button.onclick = () => {
          session.replaceRight(player.id, button.dataset.replaceRight, right);
          showTurnResult(`${player.name} 保留了“${right.name}”`);
        };
      });
      root.querySelector('[data-discard-right]').onclick = () => showTurnResult(`${player.name} 放弃了“${right.name}”`);
    };

    const activatePersistentRule = () => {
      const result = session.addPersistentRule(currentItem, instructionText());
      showTurnResult(result.replaced ? `新法则已生效，并替换“${result.replaced}”` : '新法则将从下一位玩家开始生效');
    };

    const showTransferPicker = () => {
      phase = 'panel';
      const owner = session.currentPlayer();
      root.innerHTML = renderTransferPicker(plugin, owner, ctx.players);
      bind();
      root.querySelector('[data-cancel-transfer]').onclick = () => showContent(true);
      root.querySelectorAll('[data-transfer-target]').forEach(button => {
        button.onclick = () => {
          const target = ctx.players.find(player => player.id === button.dataset.transferTarget);
          showTransferConsent(target);
        };
      });
    };

    const showTransferConsent = target => {
      const owner = session.currentPlayer();
      root.innerHTML = renderTransferConsent(plugin, owner, target);
      bind();
      root.querySelector('[data-decline-transfer]').onclick = () => showContent(true);
      root.querySelector('[data-accept-transfer]').onclick = () => {
        session.consumeRight(owner.id, 'transfer');
        startChallenge(target);
      };
    };

    const startChallenge = player => {
      clearChallengeTimer();
      phase = 'challenge';
      challengePlayer = player;
      const owner = session.currentPlayer();
      root.innerHTML = renderChallenge(plugin, session, {
        player,
        owner,
        instruction: instructionText(),
        challengeSeconds
      });
      bindCommon(() => startChallenge(player));
      root.querySelector('[data-fail]').onclick = showChallengeFailure;
      root.querySelector('[data-success]').onclick = () => {
        clearChallengeTimer();
        showTurnResult(`${player.name} 完成了个人挑战`);
      };
      tone(330, .045, ctx.global.sound, .018);
      let lastSecond = challengeSeconds;
      challengeTimer = new TimerController({
        durationMs: challengeSeconds * 1000,
        tickRateMs: 100,
        onTick(remainingMs) {
          const current = Math.ceil(remainingMs / 1000);
          const number = root.querySelector('[data-countdown] strong');
          if (number) number.textContent = String(current);
          if (current !== lastSecond && current > 0) {
            lastSecond = current;
            tone(250 + current * 18, .035, ctx.global.sound, .012);
          }
        },
        onDone() {
          root.querySelector('[data-countdown]')?.classList.add('expired');
          const note = root.querySelector('[data-timer-note]');
          if (note) note.textContent = '时间到，请现场确认是否完成。';
          vibrate([30, 30, 45], ctx.global.haptics);
        }
      });
      challengeTimer.start();
    };

    const showChallengeFailure = () => {
      clearChallengeTimer();
      const player = challengePlayer || session.currentPlayer();
      resolveMistake(player, 'challenge', () => showTurnResult(`${player.name} 挑战失败`));
    };

    const showViolation = (ruleId, returnFn) => {
      const rule = session.activeRules.find(item => item.id === ruleId);
      if (!rule) {
        returnFn();
        return;
      }
      phase = 'panel';
      root.innerHTML = renderViolation(plugin, rule, ctx.players);
      bind();
      root.querySelector('[data-cancel-violation]').onclick = returnFn;
      root.querySelectorAll('[data-violator]').forEach(button => {
        button.onclick = () => {
          const player = ctx.players.find(item => item.id === button.dataset.violator);
          resolveMistake(player, 'rule', returnFn);
        };
      });
    };

    const resolveMistake = (player, source, onDone) => {
      const usable = session.hasRight(player.id, 'shield') ? [RIGHTS.shield] : [];
      if (!usable.length) {
        recordMistake(player, source, onDone);
        return;
      }
      phase = 'panel';
      root.innerHTML = renderMistakeConfirm(plugin, player, source, usable);
      bind();
      root.querySelectorAll('[data-use-reactive]').forEach(button => {
        button.onclick = () => {
          const right = RIGHTS[button.dataset.useReactive];
          session.consumeRight(player.id, right.id);
          session.lastNotice = `${player.name} 使用“${right.name}”，本次失误已取消。`;
          session.lastMistake = null;
          onDone();
        };
      });
      root.querySelector('[data-confirm-mistake]').onclick = () => recordMistake(player, source, onDone);
    };

    const recordMistake = (player, source, onDone) => {
      const result = session.recordMistake(player, source);
      if (result.reachedLimit) {
        finish(player);
        return;
      }
      onDone();
    };

    const showRightsPanel = (playerId, returnFn) => {
      const player = ctx.players.find(item => item.id === playerId);
      const returnPhase = phase;
      phase = 'panel';
      root.innerHTML = renderRightsPanel(plugin, session, player, {
        isCurrent: playerId === session.currentPlayer().id,
        phase: returnPhase
      });
      bind();
      root.querySelector('[data-close-rights]').onclick = () => {
        phase = returnPhase;
        returnFn();
      };
      root.querySelector('[data-panel-cancel]')?.addEventListener('click', () => useCancelRule(player, returnFn));
    };

    const useCancelRule = (player, returnFn) => {
      if (!session.hasRight(player.id, 'cancel-rule') || !session.activeRules.length) {
        returnFn();
        return;
      }
      phase = 'panel';
      root.innerHTML = renderCancelRule(plugin, player, session.activeRules);
      bind();
      root.querySelector('[data-cancel-use]').onclick = returnFn;
      root.querySelectorAll('[data-cancel-rule]').forEach(button => {
        button.onclick = () => {
          const removed = session.removeRule(button.dataset.cancelRule);
          session.consumeRight(player.id, 'cancel-rule');
          session.lastNotice = `${player.name} 废除了“${removed?.instruction || '一条持续法则'}”。`;
          returnFn();
        };
      });
    };

    const showTurnResult = message => {
      clearChallengeTimer();
      phase = 'result';
      const player = session.currentPlayer();
      root.innerHTML = renderTurnResult(plugin, session, message);
      bindCommon(() => showTurnResult(message));
      root.querySelector('[data-result-cancel]')?.addEventListener('click', () => useCancelRule(player, () => showTurnResult(message)));
      root.querySelector('[data-next-turn]').onclick = advanceTurn;
    };

    const advanceTurn = () => {
      session.advanceTurn();
      currentItem = null;
      currentOverride = '';
      challengePlayer = null;
      showTurn();
    };

    const finish = loser => {
      clearChallengeTimer();
      phase = 'final';
      root.innerHTML = renderFinish(plugin, session, loser);
      bind();
      root.querySelector('[data-punish]').onclick = () => ctx.services.punishment.draw([loser], { onDone: reset });
      root.querySelector('[data-restart]').onclick = reset;
    };

    const reset = () => {
      clearChallengeTimer();
      session.reset();
      currentItem = null;
      currentOverride = '';
      challengePlayer = null;
      loading = false;
      phase = 'turn';
      showTurn();
    };

    bindPageVisibility(ctx.lifecycle, {
      onHidden() {
        if (phase === 'challenge' && challengeTimer?.state === 'running') {
          challengeTimer.pause();
          challengePausedByVisibility = challengeTimer.state === 'paused';
        }
      },
      onVisible() {
        if (phase === 'challenge' && challengePausedByVisibility && challengeTimer?.state === 'paused') {
          challengePausedByVisibility = false;
          challengeTimer.resume();
        }
      }
    });

    showTurn();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
