import { registerGame } from './registry.js';
import { escapeHtml, shuffle, tone, vibrate, wait } from '../core/utils.js';
import { bindExit, stageHeader } from './shared.js';

const WORLD_WIDTH = 1000;
const BASE_WIDTH = 600;
const MIN_BLOCK_WIDTH = 42;
const MIN_OVERLAP_RATIO = 0.12;
const PERFECT_RATIO = 0.028;
const MAX_VISIBLE_BLOCKS = 9;
const BLOCK_STEP = 25;
const BASE_BOTTOM = 22;
const DROP_DISTANCE = 72;

function speedFor(height) {
  return Math.min(650, 270 + height * 26);
}

function shrinkFor(height) {
  if (height < 4) return 1;
  if (height < 8) return 0.98;
  if (height < 12) return 0.97;
  return 0.96;
}

function difficultyLabel(height) {
  if (height < 3) return '熟悉节奏';
  if (height < 6) return '速度提升';
  if (height < 10) return '安全区缩小';
  return '高塔危险区';
}

const plugin = {
  id: 'fate-ladder',
  title: '命运叠塔',
  sortOrder: 2.3,
  icon: 'ladder',
  color: '#8c7db2',
  minPlayers: 2,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '2–8 分钟',
  shortDescription: '轮流点击放下方块，谁让塔倒谁遭殃。',
  description: '玩家依次放置左右移动的方块。点击屏幕后，方块落在塔顶安全区内即为成功，并成为下一层；没有接住则叠塔失败，当前玩家接受惩罚。塔越高，安全区越小，方块移动越快。',
  phoneMode: '玩家依次点击放置',
  resultMode: '让塔倒塌的玩家受罚',
  defaultSettings: { level: 'standard' },
  renderSetup() {
    return '<div class="info-strip"><strong>反应叠塔</strong><span>下方尺度只用于失败后的惩罚</span></div>';
  },
  mount(root, ctx) {
    let order = [];
    let turnIndex = 0;
    let tower = [];
    let moving = null;
    let phase = 'intro';
    let frameId = 0;
    let lastFrame = 0;
    let roundToken = 0;

    const currentPlayer = () => order[turnIndex % order.length];
    const height = () => Math.max(0, tower.length - 1);
    const topBlock = () => tower[tower.length - 1];
    const pct = value => `${(value / WORLD_WIDTH) * 100}%`;

    const cancelMotion = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrame = 0;
    };

    const reset = () => {
      cancelMotion();
      roundToken += 1;
      order = shuffle(ctx.players);
      turnIndex = 0;
      tower = [{ left: (WORLD_WIDTH - BASE_WIDTH) / 2, width: BASE_WIDTH, playerId: null, base: true, perfect: true }];
      moving = null;
      phase = 'intro';
      renderIntro();
    };

    const visibleTower = () => {
      const blocks = tower.slice(-MAX_VISIBLE_BLOCKS);
      return {
        blocks,
        hidden: Math.max(0, tower.length - blocks.length)
      };
    };

    const towerMarkup = ({ includeMoving = false, failed = false } = {}) => {
      const { blocks, hidden } = visibleTower();
      const targetBottom = BASE_BOTTOM + blocks.length * BLOCK_STEP;
      return `<div class="stack-world ${failed ? 'failed' : ''}" data-stack-world>
        ${hidden ? `<div class="stack-depth">下方还有 ${hidden} 层</div>` : ''}
        ${blocks.map((block, index) => {
          const absoluteIndex = hidden + index;
          const isTop = absoluteIndex === tower.length - 1;
          return `<div class="stack-block settled ${block.base ? 'base' : ''} ${isTop ? 'top' : ''} ${block.perfect ? 'perfect' : ''}" style="--left:${pct(block.left)};--width:${pct(block.width)};--bottom:${BASE_BOTTOM + index * BLOCK_STEP}px" aria-hidden="true"><i></i></div>`;
        }).join('')}
        ${includeMoving && moving ? `<div class="stack-block moving" data-moving style="--left:${pct(moving.left)};--width:${pct(moving.width)};--bottom:${targetBottom + DROP_DISTANCE}px" aria-hidden="true"><i></i></div>` : ''}
      </div>`;
    };

    const applyCamera = ({ includeMoving = false } = {}) => {
      requestAnimationFrame(() => {
        const arena = root.querySelector('.stack-arena');
        const world = root.querySelector('[data-stack-world]');
        if (!arena || !world) return;
        const visibleCount = Math.min(tower.length, MAX_VISIBLE_BLOCKS);
        const rawHeight = BASE_BOTTOM + visibleCount * BLOCK_STEP + (includeMoving ? DROP_DISTANCE + 28 : 30);
        const available = Math.max(220, arena.clientHeight - 30);
        let scale = Math.min(1, available / rawHeight);
        if (height() > 5) {
          scale = Math.min(scale, 1 - Math.min(0.28, (height() - 5) * 0.025));
        }
        scale = Math.max(0.68, scale);
        const shift = height() > 5 ? Math.min(18, (height() - 5) * 1.5) : 0;
        world.style.setProperty('--camera-scale', scale.toFixed(3));
        world.style.setProperty('--camera-shift', `${shift}px`);
      });
    };

    const renderIntro = () => {
      const first = currentPlayer();
      root.innerHTML = `${stageHeader(plugin.title, '本局只需开始一次')}
        <section class="private-stage stack-intro-stage">
          <span class="stack-pass-icon" aria-hidden="true">▰</span>
          <span class="eyebrow">第一位玩家</span>
          <h2>${escapeHtml(first.name)}</h2>
          <p>方块开始移动后，点击屏幕让它落下。成功后会自动切换到下一位，不需要逐回合确认。</p>
          <div class="stack-mini-rule"><span>塔顶亮边区域就是安全区</span><span>塔越高，移动越快、区域越窄</span></div>
          <button class="button primary full" data-start-game>开始叠塔</button>
        </section>`;
      bindExit(root, ctx);
      root.querySelector('[data-start-game]').onclick = beginTurn;
    };

    const beginTurn = async () => {
      if (!['intro', 'result', 'paused'].includes(phase)) return;
      const token = roundToken;
      const top = topBlock();
      const factor = shrinkFor(height());
      const width = Math.min(top.width, Math.max(MIN_BLOCK_WIDTH, top.width * factor));
      const direction = (height() + turnIndex) % 2 === 0 ? 1 : -1;
      moving = {
        left: direction === 1 ? 0 : WORLD_WIDTH - width,
        width,
        direction,
        speed: speedFor(height()),
        locked: false
      };
      phase = 'arming';
      renderPlay(true);
      await wait(420);
      if (token !== roundToken || phase !== 'arming') return;
      phase = 'moving';
      const state = root.querySelector('[data-stack-state]');
      if (state) state.textContent = '方块正在移动，点击屏幕放下';
      const dropButton = root.querySelector('[data-drop]');
      if (dropButton) dropButton.disabled = false;
      frameId = requestAnimationFrame(stepMotion);
    };

    const renderPlay = arming => {
      const player = currentPlayer();
      const nextLayer = height() + 1;
      root.innerHTML = `${stageHeader(plugin.title, `${escapeHtml(player.name)} · 第 ${nextLayer} 层`)}
        <section class="game-stage stack-stage">
          <div class="stack-hud">
            <div><span>当前玩家</span><strong>${escapeHtml(player.name)}</strong></div>
            <div><span>当前塔高</span><strong>${height()} 层</strong></div>
            <div><span>难度</span><strong>${difficultyLabel(height())}</strong></div>
          </div>
          <div class="stack-instruction">
            <strong data-stack-state>${arming ? `轮到 ${escapeHtml(player.name)}，方块即将移动` : '方块正在移动，点击屏幕放下'}</strong>
            <span>镜头会自动跟随塔顶；只需判断移动方块是否对准下方亮边区域。</span>
          </div>
          <div class="stack-arena" data-drop-area role="button" tabindex="0" aria-label="点击放下方块">
            ${towerMarkup({ includeMoving: true })}
            <div class="stack-arena-label">点击任意位置放下</div>
          </div>
          <button class="button primary full stack-drop-button" data-drop ${arming ? 'disabled' : ''}>点击放下</button>
        </section>`;
      bindExit(root, ctx);
      applyCamera({ includeMoving: true });
      const drop = () => dropBlock();
      root.querySelector('[data-drop-area]').onclick = drop;
      root.querySelector('[data-drop-area]').onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          drop();
        }
      };
      root.querySelector('[data-drop]').onclick = drop;
    };

    const stepMotion = time => {
      if (phase !== 'moving' || !moving) return;
      if (!lastFrame) lastFrame = time;
      const delta = Math.min(34, time - lastFrame);
      lastFrame = time;
      moving.left += moving.direction * moving.speed * (delta / 1000);
      const maxLeft = WORLD_WIDTH - moving.width;
      if (moving.left <= 0) {
        moving.left = 0;
        moving.direction = 1;
      } else if (moving.left >= maxLeft) {
        moving.left = maxLeft;
        moving.direction = -1;
      }
      const node = root.querySelector('[data-moving]');
      if (node) node.style.setProperty('--left', pct(moving.left));
      frameId = requestAnimationFrame(stepMotion);
    };

    const dropBlock = async () => {
      if (phase !== 'moving' || !moving || moving.locked) return;
      moving.locked = true;
      phase = 'dropping';
      cancelMotion();
      root.querySelector('[data-drop]')?.setAttribute('disabled', '');

      const top = topBlock();
      const movingRight = moving.left + moving.width;
      const topRight = top.left + top.width;
      const overlapLeft = Math.max(moving.left, top.left);
      const overlapRight = Math.min(movingRight, topRight);
      const overlap = Math.max(0, overlapRight - overlapLeft);
      const minimum = Math.max(24, moving.width * MIN_OVERLAP_RATIO);
      const centerGap = Math.abs((moving.left + moving.width / 2) - (top.left + top.width / 2));
      const perfect = overlap >= minimum && centerGap <= Math.max(7, top.width * PERFECT_RATIO);
      const success = overlap >= minimum;
      const node = root.querySelector('[data-moving]');

      if (node) {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        try {
          await node.animate(
            [{ transform: 'translateY(0)' }, { transform: `translateY(${DROP_DISTANCE}px)` }],
            { duration: reduced ? 80 : 260, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'forwards' }
          ).finished;
        } catch {}
      }

      if (success) {
        const nextWidth = perfect ? moving.width : overlap;
        const nextLeft = perfect ? top.left + (top.width - moving.width) / 2 : overlapLeft;
        tower.push({
          left: nextLeft,
          width: nextWidth,
          playerId: currentPlayer().id,
          base: false,
          perfect
        });
        tone(perfect ? 620 : 510, perfect ? 0.11 : 0.08, ctx.global.sound, perfect ? 0.045 : 0.035);
        vibrate(perfect ? [18, 25, 34] : [20, 24, 20], ctx.global.haptics);
        renderSuccess(perfect);
      } else {
        tone(145, 0.2, ctx.global.sound, 0.06);
        vibrate([80, 40, 110], ctx.global.haptics);
        renderCollapse();
      }
    };

    const renderSuccess = async perfect => {
      phase = 'result';
      const token = roundToken;
      const finisher = currentPlayer();
      const nextIndex = (turnIndex + 1) % order.length;
      const nextPlayer = order[nextIndex];
      root.innerHTML = `${stageHeader(plugin.title, `塔高 ${height()} 层`)}
        <section class="game-stage stack-stage stack-success-stage">
          <div class="stack-result-banner ${perfect ? 'perfect' : ''}">
            <span>${perfect ? '完美叠放' : '放置成功'}</span>
            <strong>${escapeHtml(finisher.name)} 接住了第 ${height()} 层</strong>
            <small>下一位：${escapeHtml(nextPlayer.name)} · 即将自动开始</small>
          </div>
          <div class="stack-arena static">${towerMarkup()}</div>
          <div class="stack-next-player"><span>请把手机交给</span><strong>${escapeHtml(nextPlayer.name)}</strong></div>
        </section>`;
      bindExit(root, ctx);
      applyCamera();
      await wait(perfect ? 820 : 680);
      if (token !== roundToken || phase !== 'result') return;
      turnIndex = nextIndex;
      beginTurn();
    };

    const renderCollapse = async () => {
      phase = 'failed';
      const loser = currentPlayer();
      root.innerHTML = `${stageHeader(plugin.title, '叠塔失败')}<section class="game-stage stack-stage stack-collapse-stage">
        <div class="stack-result-banner failed"><span>没有接住</span><strong>${escapeHtml(loser.name)} 让塔倒了</strong><small>本局塔高 ${height()} 层</small></div>
        <div class="stack-arena static failed">${towerMarkup({ includeMoving: true, failed: true })}</div>
      </section>`;
      bindExit(root, ctx);
      applyCamera({ includeMoving: true });
      const blocks = [...root.querySelectorAll('.stack-block.settled')];
      const missed = root.querySelector('[data-moving]');
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) {
        missed?.animate(
          [
            { transform: `translateY(${DROP_DISTANCE}px) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(290px) rotate(${moving?.direction === 1 ? 22 : -22}deg)`, opacity: 0 }
          ],
          { duration: 720, easing: 'cubic-bezier(.35,.05,.55,1)', fill: 'forwards' }
        );
        blocks.forEach((block, index) => {
          block.animate(
            [
              { transform: 'translate(0,0) rotate(0)', opacity: 1 },
              { transform: `translate(${(index % 2 ? 1 : -1) * (12 + index * 3)}px,${18 + index * 5}px) rotate(${(index % 2 ? 1 : -1) * (4 + index * 1.7)}deg)`, opacity: index < 2 ? 0.75 : 0.35 }
            ],
            { duration: 620 + index * 28, delay: index * 18, easing: 'cubic-bezier(.35,.05,.55,1)', fill: 'forwards' }
          );
        });
      }
      await wait(reduced ? 180 : 900);
      renderFinal(loser);
    };

    const renderFinal = loser => {
      phase = 'final';
      root.innerHTML = `${stageHeader(plugin.title, '本局结束')}
        <section class="game-stage centered stack-final">
          <div class="stack-fall-mark" aria-hidden="true">▰</div>
          <span class="eyebrow">叠塔失败</span>
          <h2>${escapeHtml(loser.name)} 遭殃</h2>
          <p>${escapeHtml(loser.name)} 没有接住第 ${height() + 1} 层方块。本局最终叠到 ${height()} 层。</p>
          <div class="stack-final-order"><strong>本局挑战顺序</strong><div>${order.map(player => `<span class="${player.id === loser.id ? 'loser' : ''}">${escapeHtml(player.name)}</span>`).join('')}</div></div>
          <button class="button primary full" data-punish>抽取惩罚</button>
          <button class="button secondary full" data-restart>再来一局</button>
        </section>`;
      bindExit(root, ctx);
      root.querySelector('[data-punish]').onclick = () => ctx.punishment([loser], { onDone: reset });
      root.querySelector('[data-restart]').onclick = reset;
    };

    const renderResume = () => {
      phase = 'paused';
      root.innerHTML = `${stageHeader(plugin.title, `当前塔高 ${height()} 层`)}
        <section class="private-stage stack-intro-stage">
          <span class="stack-pass-icon" aria-hidden="true">▰</span>
          <span class="eyebrow">游戏已暂停</span>
          <h2>${escapeHtml(currentPlayer().name)}</h2>
          <p>页面刚刚离开前台，本次没有判定失败。点击后重新开始当前玩家的移动方块。</p>
          <button class="button primary full" data-resume>继续本回合</button>
        </section>`;
      bindExit(root, ctx);
      root.querySelector('[data-resume]').onclick = beginTurn;
    };

    const visibilityGuard = () => {
      if (document.hidden && (phase === 'moving' || phase === 'arming')) {
        cancelMotion();
        phase = 'paused';
        return;
      }
      if (!document.hidden && phase === 'paused') renderResume();
    };

    document.addEventListener('visibilitychange', visibilityGuard);
    ctx.onCleanup(() => {
      cancelMotion();
      roundToken += 1;
      document.removeEventListener('visibilitychange', visibilityGuard);
    });

    reset();
  }
};

registerGame(plugin);
export default plugin;
