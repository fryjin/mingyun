import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { TurnManager } from '../../engine/turn-manager.js';
import { tone, vibrate, wait } from '../../core/utils.js';
import { animateLite, prefersReducedMotion, rise } from '../../motion/index.js';
import { bindGameExit } from '../../components/game-ui.js';
import { finalDiceRotation, renderDiceResult, renderDiceTurn } from './view.js';

const plugin = createGamePlugin({
  id: 'dice',
  title: '命运骰局',
  sortOrder: 3,
  icon: 'dice',
  color: '#a78bfa',
  minPlayers: 2,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '1–3 分钟',
  shortDescription: '轮流投骰，点数决定谁遭殃。',
  description: '每个人投一次骰子。全部投完后，按最高点或最低点选出本轮输家。',
  phoneMode: '依次传递手机',
  resultMode: '点数决定惩罚玩家',
  defaultSettings: { loserRule: 'high', level: 'standard' },
  renderSetup(settings) {
    return `<div class="setting-block"><div class="setting-label"><span>谁接受惩罚</span><small>本轮判定</small></div><div class="segmented" data-rule><button type="button" data-segment data-value="high" class="${settings.loserRule === 'high' ? 'active' : ''}">最高点</button><button type="button" data-segment data-value="low" class="${settings.loserRule === 'low' ? 'active' : ''}">最低点</button></div></div>`;
  },
  readSetup(sheet) {
    return { loserRule: sheet.querySelector('[data-rule] .active')?.dataset.value || 'high' };
  },
  mount(root, ctx) {
    const turn = new TurnManager(ctx.players);
    let rolls = [];
    let rolling = false;

    const render = () => {
      root.innerHTML = renderDiceTurn({ plugin, ctx, turn, rolls });
      bindGameExit(root, ctx);
      root.querySelector('[data-roll]')?.addEventListener('click', roll);
    };

    const roll = async () => {
      if (rolling) return;
      rolling = true;
      const button = root.querySelector('[data-roll]');
      const cube = root.querySelector('[data-dice-cube]');
      const scene = root.querySelector('[data-dice-scene]');
      const shadow = root.querySelector('[data-dice-shadow]');
      button.disabled = true;
      button.textContent = '命运滚动中…';

      const value = ctx.services.random.int(1, 6);
      const duration = prefersReducedMotion() ? 60 : 920;
      let tick = 0;
      const tickTimer = setInterval(() => {
        tone(170 + tick % 5 * 34, .025, ctx.global.sound, .014);
        tick += 1;
      }, 95);
      ctx.lifecycle.add(() => clearInterval(tickTimer));

      animateLite(scene, { y: [0, -18, 0], scale: [1, 1.045, 1], duration, ease: 'out(3)' });
      animateLite(shadow, { scale: [1, .72, 1], opacity: [.42, .2, .42], duration, ease: 'out(3)' });

      if (prefersReducedMotion()) cube.style.transform = finalDiceRotation(value);
      else {
        const animation = cube.animate([
          { transform: 'rotateX(-20deg) rotateY(28deg) rotateZ(0deg)', offset: 0 },
          { transform: 'rotateX(280deg) rotateY(390deg) rotateZ(60deg)', offset: .38 },
          { transform: 'rotateX(590deg) rotateY(750deg) rotateZ(105deg)', offset: .76 },
          { transform: finalDiceRotation(value), offset: 1 }
        ], { duration, easing: 'cubic-bezier(.18,.72,.2,1)', fill: 'forwards' });
        try { await animation.finished; } catch {}
      }

      clearInterval(tickTimer);
      cube.style.transform = finalDiceRotation(value);
      tone(430, .08, ctx.global.sound, .035);
      vibrate([22, 28, 46], ctx.global.haptics);
      rolls.push({ player: turn.current(), value });

      await wait(360);
      if (rolls.length >= ctx.players.length) finish();
      else {
        turn.next();
        rolling = false;
        render();
      }
    };

    const finish = () => {
      const values = rolls.map(item => item.value);
      const target = ctx.settings.loserRule === 'high' ? Math.max(...values) : Math.min(...values);
      const tied = rolls.filter(item => item.value === target);
      const loser = ctx.services.random.pick(tied).player;
      root.innerHTML = renderDiceResult({ plugin, loser, target, tied });
      bindGameExit(root, ctx);
      rise(root.querySelector('[data-result]'));
      root.querySelector('[data-punish]').onclick = () => ctx.services.punishment.draw([loser], { onDone: reset });
      root.querySelector('[data-next]').onclick = reset;
    };

    const reset = () => {
      turn.reset();
      rolls = [];
      rolling = false;
      render();
    };

    render();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
