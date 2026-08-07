import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { FrameLoop } from '../../engine/frame-loop.js';
import { bindPageVisibility } from '../../engine/visibility.js';
import { AnimationRegistry } from '../../motion/animation-registry.js';
import { prefersReducedMotion } from '../../motion/index.js';
import { tone, vibrate, wait } from '../../core/utils.js';
import { bindGameExit } from '../../components/game-ui.js';
import { STACK_CONFIG } from './physics.js';
import { FateStackSession } from './session.js';
import { applyStackCamera } from './camera.js';
import {
  renderCollapse,
  renderFinal,
  renderIntro,
  renderPlay,
  renderResume,
  renderSuccess
} from './view.js';

const plugin = createGamePlugin({
  id: 'fate-ladder',
  title: '命运叠塔',
  sortOrder: 2.3,
  icon: 'ladder',
  color: '#8c7db2',
  minPlayers: 2,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '2–8 分钟',
  shortDescription: '轮流放下方块，谁让塔倒谁遭殃。',
  description: '玩家依次放置左右移动的方块。点击画面后，方块会落在当前塔顶。只要方块有足够支撑，并且整座塔还能站稳，就能继续下一层。没有接住或让塔失去平衡的玩家接受惩罚。',
  phoneMode: '玩家轮流点击叠塔画面',
  resultMode: '让塔倒下的玩家受罚',
  defaultSettings: { level: 'standard' },
  renderSetup() {
    return '<div class="info-strip"><strong>平衡叠塔</strong><span>下方尺度只用于失败后的惩罚</span></div>';
  },
  mount(root, ctx) {
    const session = new FateStackSession(ctx.players, ctx.services.random);
    const animations = new AnimationRegistry(ctx.lifecycle);
    const loop = new FrameLoop({
      lifecycle: ctx.lifecycle,
      onFrame: ({ deltaMs }) => {
        if (session.machine.state !== 'moving') return false;
        const left = session.advanceMoving(deltaMs);
        const node = root.querySelector('[data-moving]');
        if (node && left !== null) {
          node.style.setProperty('--left', `${(left / STACK_CONFIG.worldWidth) * 100}%`);
        }
        return true;
      }
    });

    const bind = () => bindGameExit(root, ctx);
    const currentEpoch = () => session.epoch;

    const reset = () => {
      loop.stop();
      animations.cancelAll();
      session.reset();
      showIntro();
    };

    const showIntro = () => {
      root.innerHTML = renderIntro(plugin, session);
      bind();
      root.querySelector('[data-start-game]').onclick = beginTurn;
    };

    const beginTurn = async () => {
      if (!['intro', 'result', 'paused'].includes(session.machine.state)) return;
      const epoch = currentEpoch();
      session.beginTurn();
      showPlay(true);
      await wait(420);
      if (ctx.lifecycle.disposed || epoch !== currentEpoch() || session.machine.state !== 'arming') return;
      session.armComplete();
      const state = root.querySelector('[data-stack-state]');
      if (state) state.textContent = '点击画面，放下方块';
      const arena = root.querySelector('[data-drop-area]');
      arena?.setAttribute('aria-disabled', 'false');
      arena?.classList.add('ready');
      loop.start();
    };

    const showPlay = arming => {
      root.innerHTML = renderPlay(plugin, session, arming);
      bind();
      applyStackCamera(root, session, ctx.lifecycle, { includeMoving: true });
      const arena = root.querySelector('[data-drop-area]');
      const drop = () => dropBlock();
      arena.onclick = drop;
      arena.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          drop();
        }
      };
    };

    const animateDrop = async () => {
      const node = root.querySelector('[data-moving]');
      if (!node) return;
      const animation = animations.play(
        node,
        [{ transform: 'translateY(0)' }, { transform: `translateY(${STACK_CONFIG.dropDistance}px)` }],
        {
          duration: prefersReducedMotion() ? 80 : 260,
          easing: 'cubic-bezier(.2,.75,.25,1)',
          fill: 'forwards'
        }
      );
      await animations.wait(animation);
    };

    const dropBlock = async () => {
      if (!session.lockDrop()) return;
      loop.stop();
      root.querySelector('[data-drop-area]')?.setAttribute('aria-disabled', 'true');
      root.querySelector('[data-drop-area]')?.classList.remove('ready');

      await animateDrop();
      if (ctx.lifecycle.disposed || session.machine.state !== 'dropping') return;

      const loser = session.currentPlayer();
      const result = session.settleDrop();

      if (result.outcome === 'miss') {
        tone(145, .2, ctx.global.sound, .06);
        vibrate([80, 40, 110], ctx.global.haptics);
        await showCollapse(result, loser);
        return;
      }

      if (result.outcome === 'balance') {
        tone(132, .22, ctx.global.sound, .065);
        vibrate([90, 35, 130], ctx.global.haptics);
        await showCollapse(result, loser);
        return;
      }

      if (result.perfect) {
        tone(620, .11, ctx.global.sound, .045);
        vibrate([18, 25, 34], ctx.global.haptics);
      } else if (result.balance.state === 'danger') {
        tone(390, .12, ctx.global.sound, .04);
        vibrate([38, 28, 55], ctx.global.haptics);
      } else {
        tone(510, .08, ctx.global.sound, .035);
        vibrate([20, 24, 20], ctx.global.haptics);
      }

      await showSuccess(result);
    };

    const showSuccess = async result => {
      const epoch = currentEpoch();
      const nextIndex = (session.turn.index + session.turn.direction + session.order.length) % session.order.length;
      const nextPlayer = session.order[nextIndex];

      root.innerHTML = renderSuccess(plugin, session, {
        perfect: result.perfect,
        balance: result.balance,
        nextPlayer
      });
      bind();
      applyStackCamera(root, session, ctx.lifecycle);

      const delay = result.perfect ? 820 : result.balance.state === 'danger' ? 860 : 680;
      await wait(delay);
      if (ctx.lifecycle.disposed || epoch !== currentEpoch() || session.machine.state !== 'result') return;
      session.advanceTurn();
      beginTurn();
    };

    const animateCollapse = (reason, failureIndex, direction) => {
      const reduced = prefersReducedMotion();
      if (reduced) return;

      const fallDirection = direction < 0 ? -1 : 1;
      const movingNode = root.querySelector('[data-moving]');
      const blocks = [...root.querySelectorAll('.stack-block.settled')];

      if (movingNode) {
        animations.play(
          movingNode,
          [
            { transform: `translateY(${STACK_CONFIG.dropDistance}px) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${fallDirection * 85}px,290px) rotate(${fallDirection * 26}deg)`, opacity: 0 }
          ],
          { duration: 720, easing: 'cubic-bezier(.35,.05,.55,1)', fill: 'forwards' }
        );
      }

      blocks.forEach((block, index) => {
        const absoluteIndex = Number(block.dataset.towerIndex || 0);
        const unstable = reason === 'balance' && absoluteIndex > failureIndex;
        const distance = unstable ? 24 + index * 6 : 8 + index * 2;
        const opacity = unstable ? Math.max(.12, .62 - index * .035) : .72;

        animations.play(
          block,
          [
            { transform: 'translate(0,0) rotate(0)', opacity: 1 },
            {
              transform: `translate(${fallDirection * distance}px,${unstable ? 30 + index * 7 : 12 + index * 3}px) rotate(${fallDirection * (unstable ? 7 + index * 2 : 2 + index)}deg)`,
              opacity
            }
          ],
          {
            duration: 620 + index * 34,
            delay: index * 16,
            easing: 'cubic-bezier(.35,.05,.55,1)',
            fill: 'forwards'
          }
        );
      });
    };

    const showCollapse = async (result, loser) => {
      root.innerHTML = renderCollapse(plugin, session, {
        reason: result.outcome,
        finalHeight: result.finalHeight,
        loser,
        failureIndex: result.failureIndex
      });
      bind();
      applyStackCamera(root, session, ctx.lifecycle, { includeMoving: result.outcome === 'miss' });
      animateCollapse(result.outcome, result.failureIndex, result.direction);

      await wait(prefersReducedMotion() ? 180 : 940);
      if (ctx.lifecycle.disposed || session.machine.state !== 'failed') return;
      session.markFinal();
      showFinal(loser, result.outcome, result.finalHeight);
    };

    const showFinal = (loser, reason, finalHeight) => {
      root.innerHTML = renderFinal(plugin, session, loser, reason, finalHeight);
      bind();
      root.querySelector('[data-punish]').onclick = () => ctx.services.punishment.draw([loser], { onDone: reset });
      root.querySelector('[data-restart]').onclick = reset;
    };

    const showResume = () => {
      root.innerHTML = renderResume(plugin, session);
      bind();
      root.querySelector('[data-resume]').onclick = beginTurn;
    };

    bindPageVisibility(ctx.lifecycle, {
      onHidden() {
        if (!session.pause()) return;
        loop.stop();
      },
      onVisible() {
        if (session.machine.state === 'paused') showResume();
      }
    });

    showIntro();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
