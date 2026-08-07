import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { TurnManager } from '../../engine/turn-manager.js';
import { bindPageVisibility } from '../../engine/visibility.js';
import { questionEngine } from '../../data-engine/question-engine.js';
import { bindGameExit } from '../../components/game-ui.js';
import { assignKingNumbers, formatKingInstruction, selectKingTargets } from './rules.js';
import {
  renderKingError,
  renderKingReveal,
  renderNumber,
  renderNumbersComplete,
  renderPass,
  renderRoundComplete,
  renderRoundReady,
  renderTask
} from './view.js';

const plugin = createGamePlugin({
  id: 'king', title: '国王游戏', sortOrder: 2, icon: 'crown', color: '#f59e0b', minPlayers: 3, maxPlayers: 12, supportsAdult: true,
  estimatedTime: '2–5 分钟/轮', shortDescription: '每轮重新发号码，再抽国王和任务。',
  description: '每轮重新分配号码。所有人看完号码后，揭晓国王，再一次性揭晓任务和执行号码。',
  phoneMode: '逐人私密传递', resultMode: '按号码完成国王任务', defaultSettings: { level: 'standard' },
  renderSetup() { return '<div class="info-strip"><strong>每轮重新洗牌</strong><span>号码、国王和任务都会重新随机</span></div>'; },
  mount(root, ctx) {
    let round = 0, assignment = new Map(), viewTurn = null, king = null, instruction = null, targetNumbers = [];
    const bind = () => bindGameExit(root, ctx);

    const startRound = () => {
      round += 1;
      assignment = assignKingNumbers(ctx.players, ctx.services.random);
      viewTurn = new TurnManager(ctx.players);
      king = null; instruction = null; targetNumbers = [];
      showRoundReady();
    };

    const showRoundReady = () => {
      root.innerHTML = renderRoundReady(plugin, round); bind();
      root.querySelector('[data-begin]').onclick = showPass;
    };

    const showPass = () => {
      const player = viewTurn.current();
      root.innerHTML = renderPass(plugin, round, player); bind();
      root.querySelector('[data-private-open]').onclick = () => showNumber(player);
    };

    const showNumber = player => {
      root.innerHTML = renderNumber(plugin, player, assignment.get(player.id)); bind();
      root.querySelector('[data-remember]').onclick = () => {
        if (viewTurn.turn >= ctx.players.length) showNumbersComplete();
        else { viewTurn.next(); showPass(); }
      };
    };

    const showNumbersComplete = () => {
      root.innerHTML = renderNumbersComplete(plugin, round); bind();
      root.querySelector('[data-king]').onclick = revealKing;
    };

    const revealKing = () => {
      king = ctx.services.random.pick(ctx.players);
      root.innerHTML = renderKingReveal(plugin, round, king); bind();
      root.querySelector('[data-task]').onclick = revealTask;
    };

    const revealTask = async () => {
      const maxTargets = Math.max(1, ctx.players.length - 1);
      try {
        instruction = await questionEngine.drawGame({
          gameId: plugin.id,
          settings: ctx.settings,
          predicate: item => Number(item.targetCount) <= maxTargets
        });
        if (ctx.lifecycle.disposed) return;
        targetNumbers = selectKingTargets({ assignment, kingId: king.id, instruction, random: ctx.services.random });
        showTask();
      } catch (error) {
        if (ctx.lifecycle.disposed) return;
        root.innerHTML = renderKingError(plugin, error.message); bind();
        root.querySelector('[data-back]').onclick = ctx.goLobby;
      }
    };

    const showTask = (accepted = false, alternative = '') => {
      const display = formatKingInstruction(alternative || instruction.instruction, targetNumbers);
      root.innerHTML = renderTask(plugin, ctx, { round, king, instruction, targetNumbers, display, accepted }); bind();
      root.querySelector('[data-agree]')?.addEventListener('click', () => showTask(true));
      root.querySelector('[data-alt]')?.addEventListener('click', () => showTask(true, instruction.alternatives[0]));
      root.querySelector('[data-change]').onclick = revealTask;
      root.querySelector('[data-complete]')?.addEventListener('click', roundComplete);
      root.querySelector('[data-skip]').onclick = roundComplete;
    };

    const roundComplete = () => {
      root.innerHTML = renderRoundComplete(plugin, { round, king, targetNumbers }); bind();
      root.querySelector('[data-next]').onclick = startRound;
      root.querySelector('[data-exit-round]').onclick = ctx.goLobby;
    };

    bindPageVisibility(ctx.lifecycle, { onHidden() { if (root.querySelector('.secret-number')) showPass(); } });
    startRound();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
