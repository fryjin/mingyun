import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { questionEngine } from '../../data-engine/question-engine.js';
import { wait } from '../../core/utils.js';
import { prefersReducedMotion } from '../../motion/index.js';
import { bindGameExit } from '../../components/game-ui.js';
import { resolveFingerSelection, resolveImmunePlayer } from './rules.js';
import { renderFinish, renderLoadError, renderLoading, renderPunishmentComplete, renderQuestion, renderQuestionResult } from './view.js';

const plugin = createGamePlugin({
  id: 'i-did-it', title: '我居然做过', sortOrder: 6.5, icon: 'did', color: '#d28f72', minPlayers: 2, maxPlayers: 12, supportsAdult: true,
  estimatedTime: '5–15 分钟', shortDescription: '少见经历筛选，最后一人免罚。',
  description: '没做过题目经历的人点击自己的名字并放下一根手指，做过的人保留。最后留下的一位玩家免罚，其余玩家逐人接受惩罚。',
  phoneMode: '全员共看，没做过的人点击', resultMode: '最后一人免罚，其余全部受罚', defaultSettings: { fingers: 5, level: 'standard' },
  renderSetup(settings) { return `<div class="setting-block"><div class="setting-label"><span>初始手指数</span><small>决定本局长度</small></div><div class="segmented" data-fingers><button type="button" data-segment data-value="5" class="${Number(settings.fingers) !== 10 ? 'active' : ''}">5 指快局</button><button type="button" data-segment data-value="10" class="${Number(settings.fingers) === 10 ? 'active' : ''}">10 指完整局</button></div></div>`; },
  readSetup(sheet) { return { fingers: Number(sheet.querySelector('[data-fingers] .active')?.dataset.value || 5) }; },
  async mount(root, ctx) {
    const initialFingers = Number(ctx.settings.fingers) === 10 ? 10 : 5;
    let fingers = new Map(ctx.players.map(player => [player.id, initialFingers]));
    let eliminated = new Set(), selected = new Set(), question = null, questionNumber = 0, loading = false;
    const bind = () => bindGameExit(root, ctx);
    const survivors = () => ctx.players.filter(player => !eliminated.has(player.id));

    const drawQuestion = async () => {
      if (loading) return;
      loading = true;
      root.innerHTML = renderLoading(plugin); bind();
      try {
        question = await questionEngine.drawGame({ gameId: plugin.id, settings: ctx.settings });
        if (ctx.lifecycle.disposed) return;
        questionNumber += 1;
        selected = new Set();
        showQuestion();
      } catch (error) {
        if (ctx.lifecycle.disposed) return;
        root.innerHTML = renderLoadError(plugin, error.message); bind();
        root.querySelector('[data-back]').onclick = ctx.goLobby;
      } finally { loading = false; }
    };

    const showQuestion = () => {
      root.innerHTML = renderQuestion(plugin, {
        initialFingers, questionNumber, question, survivors: survivors(),
        eliminatedPlayers: ctx.players.filter(player => eliminated.has(player.id)), fingers, selected
      });
      bind();
      root.querySelectorAll('[data-player]').forEach(button => {
        button.onclick = () => {
          const id = button.dataset.player;
          selected.has(id) ? selected.delete(id) : selected.add(id);
          showQuestion();
        };
      });
      root.querySelector('[data-change]').onclick = drawQuestion;
      root.querySelector('[data-confirm]').onclick = confirmQuestion;
    };

    const confirmQuestion = async () => {
      const before = survivors();
      root.querySelectorAll('button').forEach(button => { button.disabled = true; });
      before.filter(player => selected.has(player.id)).forEach(player => root.querySelector(`[data-player="${player.id}"]`)?.classList.add('losing-finger'));
      await wait(prefersReducedMotion() ? 40 : 360);
      if (ctx.lifecycle.disposed) return;

      const result = resolveFingerSelection({ players: ctx.players, fingers, eliminated, selected });
      fingers = result.fingers;
      eliminated = result.eliminated;
      const immune = resolveImmunePlayer({ before: result.before, survivors: result.survivors, random: ctx.services.random });
      if (immune.winner) { showFinish(immune.winner, immune.randomImmune); return; }

      root.innerHTML = renderQuestionResult(plugin, { questionNumber, question, didNot: result.didNot, did: result.did, newlyEliminated: result.newlyEliminated });
      bind();
      root.querySelector('[data-next]').onclick = drawQuestion;
    };

    const showFinish = (winner, randomImmune = false) => {
      const losers = ctx.players.filter(player => player.id !== winner.id);
      root.innerHTML = renderFinish(plugin, winner, losers, randomImmune); bind();
      root.querySelector('[data-punish-all]').onclick = () => punishSequentially(losers, 0);
      root.querySelector('[data-restart]').onclick = reset;
    };

    const punishSequentially = (losers, index) => {
      if (index >= losers.length) {
        root.innerHTML = renderPunishmentComplete(plugin); bind();
        root.querySelector('[data-restart]').onclick = reset;
        root.querySelector('[data-lobby]').onclick = ctx.goLobby;
        return;
      }
      ctx.services.punishment.draw([losers[index]], { onDone: () => punishSequentially(losers, index + 1) });
    };

    const reset = () => {
      fingers = new Map(ctx.players.map(player => [player.id, initialFingers]));
      eliminated = new Set(); selected = new Set(); question = null; questionNumber = 0; loading = false;
      drawQuestion();
    };

    drawQuestion();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
