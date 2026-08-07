import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { TimerController } from '../../engine/timer.js';
import { bindPageVisibility } from '../../engine/visibility.js';
import { tone, vibrate } from '../../core/utils.js';
import { animateLite, cancelMotion } from '../../motion/index.js';
import { bindGameExit } from '../../components/game-ui.js';
import { directionLabel, drawBombDurationSeconds } from './rules.js';
import { renderExplosion, renderIdle, renderPaused, renderRunning } from './view.js';

const plugin = createGamePlugin({
  id: 'hot-potato', title: '炸弹传递', sortOrder: 8, icon: 'bomb', color: '#fb7185', minPlayers: 3, maxPlayers: 12, supportsAdult: true,
  estimatedTime: '10–60 秒', shortDescription: '隐藏计时，爆炸时拿着手机的人输。',
  description: '点燃后直接按固定方向传递手机。时间不会显示，爆炸时拿着手机的人接受惩罚。',
  phoneMode: '玩家直接传递手机', resultMode: '爆炸时持有者接受惩罚', defaultSettings: { duration: 'standard', direction: 'clockwise', level: 'standard' },
  renderSetup(settings) {
    const direction = settings.direction === 'counter' ? 'counter' : 'clockwise';
    return `<div class="setting-block"><div class="setting-label"><span>炸弹时长</span><small>隐藏倒计时</small></div><div class="preset-cards" data-duration><button type="button" data-segment data-value="short" class="${settings.duration === 'short' ? 'active' : ''}"><strong>短局</strong><span>10–20 秒</span></button><button type="button" data-segment data-value="standard" class="${settings.duration === 'standard' ? 'active' : ''}"><strong>中局</strong><span>20–40 秒</span></button><button type="button" data-segment data-value="long" class="${settings.duration === 'long' ? 'active' : ''}"><strong>长局</strong><span>40–60 秒</span></button></div></div><div class="setting-block"><div class="setting-label"><span>传递方向</span><small>整轮固定</small></div><div class="segmented" data-direction><button type="button" data-segment data-value="clockwise" class="${direction === 'clockwise' ? 'active' : ''}">顺时针</button><button type="button" data-segment data-value="counter" class="${direction === 'counter' ? 'active' : ''}">逆时针</button></div></div>`;
  },
  readSetup(sheet) {
    return {
      duration: sheet.querySelector('[data-duration] .active')?.dataset.value || 'standard',
      direction: sheet.querySelector('[data-direction] .active')?.dataset.value || 'clockwise'
    };
  },
  mount(root, ctx) {
    const direction = directionLabel(ctx.settings.direction);
    let phase = 'idle', timer = null, bombNode = null;
    const bind = () => bindGameExit(root, ctx);
    const disposeTimer = () => { timer?.cancel(); timer = null; };
    const stopBombMotion = () => { if (bombNode) cancelMotion(bombNode); bombNode = null; };
    ctx.lifecycle.add(() => { disposeTimer(); stopBombMotion(); });

    const showIdle = () => {
      phase = 'idle'; stopBombMotion(); root.innerHTML = renderIdle(plugin, direction); bind();
      root.querySelector('[data-light]').onclick = start;
    };

    const showRunning = () => {
      phase = 'running'; root.innerHTML = renderRunning(plugin, direction); bind();
      bombNode = root.querySelector('[data-bomb]');
      animateLite(bombNode, { scale: [1, 1.035, 1], rotate: [-1.5, 1.5, -1.5], duration: 760, loop: true, ease: 'inOut(2)' });
    };

    const start = () => {
      disposeTimer();
      const seconds = drawBombDurationSeconds(ctx.settings.duration, ctx.services.random);
      timer = new TimerController({ durationMs: seconds * 1000, tickRateMs: 125, onDone: explode });
      tone(240, .2, ctx.global.sound, .05); vibrate([30, 30, 30], ctx.global.haptics);
      showRunning(); timer.start();
    };

    const pause = () => {
      if (phase !== 'running' || timer?.state !== 'running') return;
      timer.pause();
      if (timer.state === 'finished' || phase === 'exploded') return;
      stopBombMotion(); phase = 'paused'; root.innerHTML = renderPaused(plugin, direction); bind();
      root.querySelector('[data-resume]').onclick = resume;
    };

    const resume = () => {
      if (phase !== 'paused' || timer?.state !== 'paused') return;
      showRunning(); timer.resume();
    };

    const explode = () => {
      if (phase === 'exploded') return;
      phase = 'exploded'; stopBombMotion();
      tone(80, .55, ctx.global.sound, .09); vibrate([120, 60, 180], ctx.global.haptics);
      root.innerHTML = renderExplosion(plugin); bind();
      animateLite(root.querySelector('[data-burst]'), { scale: [.25, 1.18, 1], rotate: [-8, 4, 0], opacity: [0, 1, 1], duration: 620, ease: 'out(4)' });
      root.querySelector('[data-punish]').onclick = () => ctx.services.punishment.draw([{ id: 'current-holder', name: '当前持有者' }], { onDone: reset });
      root.querySelector('[data-again]').onclick = reset;
    };

    const reset = () => { disposeTimer(); stopBombMotion(); showIdle(); };
    bindPageVisibility(ctx.lifecycle, { onHidden() { if (phase === 'running') pause(); } });
    showIdle();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
