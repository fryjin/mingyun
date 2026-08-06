import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { TurnManager } from '../../engine/turn-manager.js';
import { questionEngine } from '../../data-engine/question-engine.js';
import { escapeHtml } from '../../core/utils.js';
import { bindGameExit, gameHeader } from '../../components/game-ui.js';
import { renderIntro, renderPass, renderReady, renderResult, renderVote } from './view.js';

const plugin = createGamePlugin({
  id: 'most-likely',
  title: '谁最可能',
  sortOrder: 6,
  icon: 'vote',
  color: '#22d3ee',
  minPlayers: 3,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '1–2 分钟',
  shortDescription: '全员秘密投票，最后统一揭晓结果。',
  description: '所有玩家依次私密投票，投票过程中不显示任何票数。全部完成后统一揭晓得票最高者。',
  phoneMode: '逐人私密传递',
  resultMode: '最高票玩家接受惩罚',
  defaultSettings: { tieRule: 'all', level: 'standard' },
  renderSetup(settings) {
    return `<div class="setting-block"><div class="setting-label"><span>平票处理</span><small>最高票并列时</small></div><div class="segmented" data-tie><button type="button" data-segment data-value="all" class="${settings.tieRule === 'all' ? 'active' : ''}">并列全部</button><button type="button" data-segment data-value="random" class="${settings.tieRule === 'random' ? 'active' : ''}">随机一人</button></div></div>`;
  },
  readSetup(sheet) {
    return { tieRule: sheet.querySelector('[data-tie] .active')?.dataset.value || 'all' };
  },
  async mount(root, ctx) {
    const turn = new TurnManager(ctx.players);
    let prompt;
    let votes = [];

    try {
      prompt = await questionEngine.drawGame({ gameId: plugin.id, settings: ctx.settings });
    } catch (error) {
      root.innerHTML = `${gameHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(error.message)}</p></section>`;
      bindGameExit(root, ctx);
      return;
    }

    const intro = () => {
      root.innerHTML = renderIntro(plugin, ctx, prompt);
      bindGameExit(root, ctx);
      root.querySelector('[data-begin]').onclick = pass;
    };

    const pass = () => {
      const voter = turn.current();
      root.innerHTML = renderPass(plugin, voter);
      bindGameExit(root, ctx);
      root.querySelector('[data-private-open]').onclick = () => vote(voter);
    };

    const vote = voter => {
      root.innerHTML = renderVote(plugin, ctx, voter, prompt);
      bindGameExit(root, ctx);
      root.querySelectorAll('[data-candidate]').forEach(button => {
        button.onclick = () => save(button.dataset.candidate);
      });
      root.querySelector('[data-skip]').onclick = () => save(null);
    };

    const save = candidateId => {
      if (candidateId) votes.push(candidateId);
      if (turn.turn >= ctx.players.length) ready();
      else {
        turn.next();
        pass();
      }
    };

    const ready = () => {
      root.innerHTML = renderReady(plugin);
      bindGameExit(root, ctx);
      root.querySelector('[data-reveal]').onclick = reveal;
    };

    const reveal = () => {
      const counts = new Map(ctx.players.map(player => [player.id, 0]));
      votes.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
      const maximum = Math.max(...counts.values());
      const winners = ctx.players.filter(player => counts.get(player.id) === maximum);
      const losers = ctx.settings.tieRule === 'random' && winners.length > 1 ? [ctx.services.random.pick(winners)] : winners;
      root.innerHTML = renderResult(plugin, ctx, counts, losers);
      bindGameExit(root, ctx);
      root.querySelector('[data-punish]').onclick = () => ctx.services.punishment.draw(losers, { onDone: reset });
      root.querySelector('[data-next]').onclick = reset;
    };

    const reset = async () => {
      turn.reset();
      votes = [];
      try {
        prompt = await questionEngine.drawGame({ gameId: plugin.id, settings: ctx.settings });
        intro();
      } catch (error) {
        root.innerHTML = `${gameHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(error.message)}</p></section>`;
        bindGameExit(root, ctx);
      }
    };

    intro();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
