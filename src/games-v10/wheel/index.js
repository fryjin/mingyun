import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { tone, vibrate } from '../../core/utils.js';
import { animateLite, prefersReducedMotion, rise } from '../../motion/index.js';
import { bindGameExit } from '../../components/game-ui.js';
import { renderWheelGame, renderWheelResult } from './view.js';

export function wheelProgress(t, acceleration = .17, cruise = .16, deceleration = .67) {
  const maxVelocity = 1 / (acceleration / 2 + cruise + deceleration / 2);
  if (t < acceleration) return .5 * (t * t / acceleration) * maxVelocity;
  if (t < acceleration + cruise) return (acceleration / 2 + (t - acceleration)) * maxVelocity;
  const elapsed = t - acceleration - cruise;
  return (acceleration / 2 + cruise + elapsed - elapsed * elapsed / (2 * deceleration)) * maxVelocity;
}

const plugin = createGamePlugin({
  id: 'wheel',
  title: '命运转盘',
  sortOrder: 4,
  icon: 'wheel',
  color: '#d4af61',
  minPlayers: 2,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '30 秒',
  shortDescription: '转动命运星盘，随机选出一位玩家。',
  description: '启动命运星盘。固定信标最终指向的玩家接受本轮惩罚。',
  phoneMode: '一人点击即可',
  resultMode: '星盘随机选人',
  defaultSettings: { turns: 5, level: 'standard' },
  renderSetup(settings) {
    return `<div class="setting-block"><div class="setting-label"><span>转动节奏</span><small>动画时长</small></div><div class="segmented" data-turns><button type="button" data-segment data-value="4" class="${settings.turns === 4 ? 'active' : ''}">轻快</button><button type="button" data-segment data-value="5" class="${settings.turns === 5 ? 'active' : ''}">标准</button><button type="button" data-segment data-value="7" class="${settings.turns === 7 ? 'active' : ''}">更久</button></div></div>`;
  },
  readSetup(sheet) {
    return { turns: Number(sheet.querySelector('[data-turns] .active')?.dataset.value || 5) };
  },
  mount(root, ctx) {
    let rotation = 0;
    let innerRotation = 0;
    let haloRotation = 0;
    let spinning = false;
    let frameId = 0;

    const cancelFrame = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };
    ctx.lifecycle.add(cancelFrame);

    const renderGame = () => {
      cancelFrame();
      spinning = false;
      rotation = 0;
      innerRotation = 0;
      haloRotation = 0;
      root.innerHTML = renderWheelGame({ plugin, players: ctx.players });
      bindGameExit(root, ctx);
      root.querySelector('[data-spin]').onclick = spin;
    };

    const spin = () => {
      if (spinning) return;
      spinning = true;
      const count = ctx.players.length;
      const step = 360 / count;
      const wheel = root.querySelector('[data-wheel]');
      const inner = root.querySelector('[data-inner]');
      const halo = root.querySelector('[data-halo]');
      const core = root.querySelector('[data-core]');
      const assembly = root.querySelector('[data-assembly]');
      const button = root.querySelector('[data-spin]');
      button.disabled = true;
      button.textContent = '命运转动中…';
      assembly.classList.add('is-spinning');
      root.querySelectorAll('[data-player-node]').forEach(node => node.classList.remove('selected', 'nearby'));

      const winnerIndex = ctx.services.random.int(0, count - 1);
      const turns = Number(ctx.settings.turns) || 5;
      const start = rotation;
      const startNormalized = ((start % 360) + 360) % 360;
      const centerAngle = winnerIndex * step + step / 2;
      const targetNormalized = (360 - centerAngle) % 360;
      const delta = (targetNormalized - startNormalized + 360) % 360;
      const end = start + turns * 360 + delta;
      const innerStart = innerRotation;
      const innerEnd = innerStart - (turns + 1.7) * 360;
      const haloStart = haloRotation;
      const haloEnd = haloStart + (turns * .72 + 1.15) * 360;
      const duration = prefersReducedMotion() ? 100 : 3900 + turns * 210;
      const started = performance.now();
      let lastTick = Math.floor(start / step);

      const applyTransforms = () => {
        wheel.style.transform = `rotate(${rotation}deg)`;
        wheel.style.setProperty('--counter-rotation', `${-rotation}deg`);
        inner.style.transform = `translate(-50%,-50%) rotate(${innerRotation}deg)`;
        halo.style.transform = `translate(-50%,-50%) rotate(${haloRotation}deg)`;
      };

      animateLite(assembly, { scale: [1, .985, 1.018, 1], duration: 680, ease: 'out(3)' });
      animateLite(core, { scale: [1, .9, 1.08, 1], opacity: [1, .82, 1, 1], duration: 760, ease: 'out(4)' });

      const frame = now => {
        if (!spinning || ctx.lifecycle.disposed) return;
        const progress = Math.min(1, (now - started) / duration);
        rotation = start + (end - start) * wheelProgress(progress, .17, .16, .67);
        innerRotation = innerStart + (innerEnd - innerStart) * wheelProgress(progress, .12, .15, .73);
        haloRotation = haloStart + (haloEnd - haloStart) * wheelProgress(progress, .2, .18, .62);
        applyTransforms();
        const tick = Math.floor(rotation / step);
        if (tick !== lastTick) {
          lastTick = tick;
          tone(190 + Math.max(0, 1 - progress) * 150, .018, ctx.global.sound, .012);
          vibrate(progress > .72 ? 5 : 3, ctx.global.haptics);
        }
        if (progress < 1) frameId = requestAnimationFrame(frame);
        else settle({ end, innerEnd, haloEnd, winnerIndex, wheel, core, assembly });
      };

      frameId = requestAnimationFrame(frame);
    };

    const settle = async ({ end, innerEnd, haloEnd, winnerIndex, wheel, core, assembly }) => {
      frameId = 0;
      rotation = end;
      innerRotation = innerEnd;
      haloRotation = haloEnd;
      wheel.style.transform = `rotate(${rotation}deg)`;
      wheel.style.setProperty('--counter-rotation', `${-rotation}deg`);
      root.querySelector('[data-inner]').style.transform = `translate(-50%,-50%) rotate(${innerRotation}deg)`;
      root.querySelector('[data-halo]').style.transform = `translate(-50%,-50%) rotate(${haloRotation}deg)`;
      assembly.classList.remove('is-spinning');
      assembly.classList.add('is-settled');
      const nodes = [...root.querySelectorAll('[data-player-node]')];
      nodes.forEach((node, index) => {
        node.classList.toggle('selected', index === winnerIndex);
        node.classList.toggle('nearby', index === (winnerIndex - 1 + nodes.length) % nodes.length || index === (winnerIndex + 1) % nodes.length);
      });

      if (!prefersReducedMotion()) {
        const rebound = wheel.animate([
          { transform: `rotate(${end}deg)` },
          { transform: `rotate(${end + 2.1}deg)` },
          { transform: `rotate(${end - .65}deg)` },
          { transform: `rotate(${end}deg)` }
        ], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
        animateLite(core, { scale: [1, 1.16, .96, 1.06, 1], duration: 720, ease: 'out(4)' });
        try { await rebound.finished; } catch {}
      }

      if (ctx.lifecycle.disposed) return;
      vibrate([32, 30, 72], ctx.global.haptics);
      tone(540, .14, ctx.global.sound, .04);
      spinning = false;
      ctx.lifecycle.timeout(() => showResult(ctx.players[winnerIndex]), 620);
    };

    const showResult = player => {
      root.innerHTML = renderWheelResult({ plugin, player });
      bindGameExit(root, ctx);
      rise(root.querySelector('[data-winner]'));
      root.querySelector('[data-punish]').onclick = () => ctx.services.punishment.draw([player], { onDone: renderGame });
      root.querySelector('[data-again]').onclick = renderGame;
    };

    renderGame();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
