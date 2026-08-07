import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { TurnManager } from '../../engine/turn-manager.js';
import { questionEngine } from '../../data-engine/question-engine.js';
import { escapeHtml } from '../../core/utils.js';
import { bindGameExit, gameHeader } from '../../components/game-ui.js';
import { renderWouldRatherChoice, renderWouldRatherIntro, renderWouldRatherPass, renderWouldRatherReady, renderWouldRatherResult } from './view.js';

export function resolveWouldRather({ players, choices, settlement }) {
  const groupA = choices.filter(choice => choice.value === 'A').map(choice => choice.player);
  const groupB = choices.filter(choice => choice.value === 'B').map(choice => choice.player);
  let losers;
  if (groupA.length === groupB.length) losers = [...players];
  else if (settlement === 'majority') losers = groupA.length > groupB.length ? groupA : groupB;
  else {
    const minority = groupA.length < groupB.length ? groupA : groupB;
    losers = minority.length ? minority : [];
  }
  return { groupA, groupB, losers };
}

const plugin = createGamePlugin({
  id: 'would-rather',
  title: '二选一',
  sortOrder: 1,
  icon: 'split',
  color: '#60a5fa',
  minPlayers: 2,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '1–2 分钟',
  shortDescription: '逐人秘密选择，最后统一揭晓。',
  description: '每个人秘密选择 A 或 B。全部选完后统一揭晓，由少数派或多数派接受惩罚。',
  phoneMode: '逐人私密传递',
  resultMode: '少数派或多数派接受惩罚',
  defaultSettings: { settlement: 'minority', level: 'standard' },
  renderSetup(settings) {
    const settlement = ['minority', 'majority'].includes(settings.settlement) ? settings.settlement : 'minority';
    return `<div class="setting-block"><div class="setting-label"><span>哪一派接受惩罚</span><small>揭晓后结算</small></div><div class="segmented" data-settlement><button type="button" data-segment data-value="minority" class="${settlement === 'minority' ? 'active' : ''}">少数派</button><button type="button" data-segment data-value="majority" class="${settlement === 'majority' ? 'active' : ''}">多数派</button></div></div>`;
  },
  readSetup(sheet) {
    return { settlement: sheet.querySelector('[data-settlement] .active')?.dataset.value || 'minority' };
  },
  async mount(root, ctx) {
    const turn = new TurnManager(ctx.players);
    const settlement = ['minority', 'majority'].includes(ctx.settings.settlement) ? ctx.settings.settlement : 'minority';
    let item;
    let choices = [];
    let loadSequence = 0;

    const renderError = error => {
      root.innerHTML = `${gameHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(error.message)}</p><button class="button secondary full" data-retry>重新加载</button></section>`;
      bindGameExit(root, ctx);
      root.querySelector('[data-retry]').onclick = loadQuestion;
    };

    const loadQuestion = async () => {
      const sequence = ++loadSequence;
      choices = [];
      turn.reset();
      try {
        const next = await questionEngine.drawGame({ gameId: plugin.id, settings: ctx.settings });
        if (ctx.lifecycle.disposed || sequence !== loadSequence) return;
        item = next;
        intro();
      } catch (error) {
        if (!ctx.lifecycle.disposed && sequence === loadSequence) renderError(error);
      }
    };

    const intro = () => {
      root.innerHTML = renderWouldRatherIntro({ plugin, ctx, item });
      bindGameExit(root, ctx);
      root.querySelector('[data-start]').onclick = pass;
    };

    const pass = () => {
      const player = turn.current();
      root.innerHTML = renderWouldRatherPass({ plugin, player });
      bindGameExit(root, ctx);
      root.querySelector('[data-private-open]').onclick = () => choose(player);
    };

    const choose = player => {
      root.innerHTML = renderWouldRatherChoice({ plugin, player, item });
      bindGameExit(root, ctx);
      root.querySelectorAll('[data-value]').forEach(button => {
        button.onclick = () => save(player, button.dataset.value);
      });
    };

    const save = (player, value) => {
      choices.push({ player, value });
      if (choices.length >= ctx.players.length) ready();
      else {
        turn.next();
        pass();
      }
    };

    const ready = () => {
      root.innerHTML = renderWouldRatherReady(plugin);
      bindGameExit(root, ctx);
      root.querySelector('[data-reveal]').onclick = reveal;
    };

    const reveal = () => {
      const result = resolveWouldRather({ players: ctx.players, choices, settlement });
      root.innerHTML = renderWouldRatherResult({ plugin, item, ...result });
      bindGameExit(root, ctx);
      root.querySelector('[data-punish]')?.addEventListener('click', () => {
        ctx.services.punishment.draw(result.losers, { onDone: loadQuestion });
      });
      root.querySelector('[data-next]').onclick = loadQuestion;
    };

    ctx.lifecycle.add(() => { loadSequence += 1; });
    await loadQuestion();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
