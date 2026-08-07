import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { TurnManager } from '../../engine/turn-manager.js';
import { TimerController } from '../../engine/timer.js';
import { questionEngine } from '../../data-engine/question-engine.js';
import { clamp, escapeHtml, tone, vibrate } from '../../core/utils.js';
import { bindGameExit, gameHeader } from '../../components/game-ui.js';
import { renderFiveSecondCountdown, renderFiveSecondDecision, renderFiveSecondReady } from './view.js';

const plugin = createGamePlugin({
  id: 'five-second',
  title: '五秒挑战',
  sortOrder: 7,
  icon: 'timer',
  color: '#fbbf24',
  minPlayers: 2,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '3–60 秒/轮',
  shortDescription: '限时完成题目，倒计时可自由设置。',
  description: '当前玩家在自定义时限内完成挑战，由其他玩家判断成功或失败。失败者进入共享惩罚。',
  phoneMode: '主持人操作即可',
  resultMode: '挑战失败者接受惩罚',
  defaultSettings: { seconds: 5, autoNext: true, level: 'standard' },
  renderSetup(settings) {
    return `<div class="setting-block"><div class="setting-label"><span>挑战时长</span><small>3–60 秒</small></div><div class="time-stepper"><button type="button" data-minus>−</button><input data-seconds type="number" min="3" max="60" value="${settings.seconds || 5}"><button type="button" data-plus>＋</button></div><div class="preset-row">${[5, 10, 15, 30].map(value => `<button type="button" data-preset="${value}" class="${Number(settings.seconds) === value ? 'active' : ''}">${value} 秒</button>`).join('')}</div></div>`;
  },
  bindSetup(sheet) {
    const input = sheet.querySelector('[data-seconds]');
    sheet.querySelector('[data-minus]').onclick = () => { input.value = clamp(Number(input.value || 5) - 1, 3, 60); };
    sheet.querySelector('[data-plus]').onclick = () => { input.value = clamp(Number(input.value || 5) + 1, 3, 60); };
    sheet.querySelectorAll('[data-preset]').forEach(button => {
      button.onclick = () => {
        input.value = button.dataset.preset;
        sheet.querySelectorAll('[data-preset]').forEach(candidate => candidate.classList.remove('active'));
        button.classList.add('active');
      };
    });
  },
  readSetup(sheet) {
    return { seconds: clamp(Number(sheet.querySelector('[data-seconds]').value || 5), 3, 60) };
  },
  async mount(root, ctx) {
    const turn = new TurnManager(ctx.players);
    let item;
    let activePrompt = '';
    let accepted = false;
    let timer = null;
    let loadSequence = 0;

    const cancelTimer = () => {
      timer?.cancel();
      timer = null;
    };
    ctx.lifecycle.add(cancelTimer);
    ctx.lifecycle.add(() => { loadSequence += 1; });

    const renderError = error => {
      root.innerHTML = `${gameHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(error.message)}</p><button class="button secondary full" data-retry>重新加载</button></section>`;
      bindGameExit(root, ctx);
      root.querySelector('[data-retry]').onclick = loadQuestion;
    };

    const loadQuestion = async () => {
      cancelTimer();
      accepted = false;
      activePrompt = '';
      const sequence = ++loadSequence;
      try {
        const next = await questionEngine.drawGame({ gameId: plugin.id, settings: ctx.settings });
        if (ctx.lifecycle.disposed || sequence !== loadSequence) return;
        item = next;
        activePrompt = item.prompt;
        renderReady();
      } catch (error) {
        if (!ctx.lifecycle.disposed && sequence === loadSequence) renderError(error);
      }
    };

    const renderReady = () => {
      const player = turn.current();
      root.innerHTML = renderFiveSecondReady({ plugin, ctx, player, item, prompt: activePrompt, accepted });
      bindGameExit(root, ctx);
      root.querySelector('[data-agree]')?.addEventListener('click', () => {
        accepted = true;
        renderReady();
      });
      root.querySelector('[data-alt]')?.addEventListener('click', () => {
        accepted = true;
        activePrompt = item.alternatives[0];
        renderReady();
      });
      root.querySelector('[data-change]').onclick = loadQuestion;
      root.querySelector('[data-start]')?.addEventListener('click', () => start(player));
    };

    const start = player => {
      cancelTimer();
      const seconds = clamp(Number(ctx.settings.seconds) || 5, 3, 60);
      root.innerHTML = renderFiveSecondCountdown({ plugin, prompt: activePrompt, seconds });
      bindGameExit(root, ctx);
      const timeNode = root.querySelector('[data-time]');
      let previousSecond = seconds;
      timer = new TimerController({
        durationMs: seconds * 1000,
        tickRateMs: 80,
        onTick(remainingMs) {
          const currentSecond = Math.ceil(remainingMs / 1000);
          if (timeNode) timeNode.textContent = String(currentSecond);
          if (currentSecond !== previousSecond) {
            previousSecond = currentSecond;
            if (currentSecond > 0 && currentSecond <= 3) {
              tone(520 + currentSecond * 60, .06, ctx.global.sound, .04);
              vibrate(20, ctx.global.haptics);
            }
          }
        },
        onDone() {
          timer = null;
          finish(player);
        }
      });
      timer.start();
    };

    const finish = player => {
      tone(180, .18, ctx.global.sound, .06);
      vibrate([80, 40, 80], ctx.global.haptics);
      root.innerHTML = renderFiveSecondDecision({ plugin, prompt: activePrompt });
      bindGameExit(root, ctx);
      root.querySelector('[data-success]').onclick = advance;
      root.querySelector('[data-fail]').onclick = () => {
        ctx.services.punishment.draw([player], { onDone: advance });
      };
    };

    const advance = () => {
      turn.next();
      loadQuestion();
    };

    await loadQuestion();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
