import { registerGame } from './registry.js';
import { escapeHtml, shuffle, tone, vibrate, wait } from '../core/utils.js';
import { bindExit, stageHeader } from './shared.js';

const WORLD_WIDTH = 1000;
const BLOCK_WIDTH = 500;
const BASE_WIDTH = 640;
const MIN_OVERLAP_RATIO = 0.20;
const PERFECT_RATIO = 0.03;
const DANGER_CLEARANCE_RATIO = 0.22;
const OFFSET_CLEARANCE_RATIO = 0.48;
const MAX_VISIBLE_BLOCKS = 8;
const BLOCK_STEP = 38;
const BASE_BOTTOM = 22;
const DROP_DISTANCE = 88;

function speedFor(height) {
  if (height < 4) return 320;
  if (height < 8) return 360;
  if (height < 12) return 415;
  return 470;
}

function safetyMarginRatio(height) {
  if (height < 5) return 0.04;
  if (height < 10) return 0.05;
  return 0.06;
}

function towerStageLabel(height) {
  if (height < 3) return '刚刚开始';
  if (height < 7) return '塔身开始偏移';
  if (height < 12) return '需要保持平衡';
  return '临界高塔';
}

function statusLabel(state) {
  if (state === 'danger') return '危险';
  if (state === 'offset') return '有些偏';
  return '稳定';
}

function evaluateTower(blocks) {
  if (blocks.length <= 1) {
    return { stable: true, state: 'stable', direction: 0, tilt: 0, minClearance: 1, failureIndex: -1 };
  }

  const count = blocks.length;
  const suffixCenter = Array(count + 1).fill(0);
  const suffixWeight = Array(count + 1).fill(0);

  for (let index = count - 1; index >= 1; index -= 1) {
    suffixCenter[index] = suffixCenter[index + 1] + blocks[index].left + blocks[index].width / 2;
    suffixWeight[index] = suffixWeight[index + 1] + 1;
  }

  const margin = BLOCK_WIDTH * safetyMarginRatio(count - 1);
  let minClearance = Number.POSITIVE_INFINITY;
  let worstDirection = 0;
  let worstSupport = -1;

  for (let supportIndex = count - 2; supportIndex >= 0; supportIndex -= 1) {
    const support = blocks[supportIndex];
    const firstAbove = blocks[supportIndex + 1];
    const overlapLeft = Math.max(support.left, firstAbove.left);
    const overlapRight = Math.min(support.left + support.width, firstAbove.left + firstAbove.width);
    const effectiveLeft = overlapLeft + margin;
    const effectiveRight = overlapRight - margin;

    if (effectiveRight <= effectiveLeft || suffixWeight[supportIndex + 1] <= 0) {
      return {
        stable: false,
        state: 'danger',
        direction: firstAbove.left + firstAbove.width / 2 < support.left + support.width / 2 ? -1 : 1,
        tilt: 0,
        minClearance: -1,
        failureIndex: supportIndex
      };
    }

    const centerOfMass = suffixCenter[supportIndex + 1] / suffixWeight[supportIndex + 1];
    const supportCenter = (effectiveLeft + effectiveRight) / 2;
    const halfSpan = Math.max(1, (effectiveRight - effectiveLeft) / 2);
    const clearance = Math.min(centerOfMass - effectiveLeft, effectiveRight - centerOfMass);
    const normalized = clearance / halfSpan;

    if (centerOfMass < effectiveLeft || centerOfMass > effectiveRight) {
      return {
        stable: false,
        state: 'danger',
        direction: centerOfMass < supportCenter ? -1 : 1,
        tilt: 0,
        minClearance: normalized,
        failureIndex: supportIndex
      };
    }

    if (normalized < minClearance) {
      minClearance = normalized;
      worstDirection = centerOfMass < supportCenter ? -1 : centerOfMass > supportCenter ? 1 : 0;
      worstSupport = supportIndex;
    }
  }

  const state = minClearance < DANGER_CLEARANCE_RATIO
    ? 'danger'
    : minClearance < OFFSET_CLEARANCE_RATIO
      ? 'offset'
      : 'stable';
  const tilt = state === 'danger' ? worstDirection * 0.72 : state === 'offset' ? worstDirection * 0.30 : 0;

  return {
    stable: true,
    state,
    direction: worstDirection,
    tilt,
    minClearance: Number.isFinite(minClearance) ? minClearance : 1,
    failureIndex: worstSupport
  };
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
  shortDescription: '轮流放下方块，谁让塔倒谁遭殃。',
  description: '玩家依次放置左右移动的方块。点击画面后，方块会落在当前塔顶。只要方块有足够支撑，并且整座塔还能站稳，就能继续下一层。没有接住或让塔失去平衡的玩家接受惩罚。',
  phoneMode: '玩家轮流点击叠塔画面',
  resultMode: '让塔倒下的玩家受罚',
  defaultSettings: { level: 'standard' },
  renderSetup() {
    return '<div class="info-strip"><strong>平衡叠塔</strong><span>下方尺度只用于失败后的惩罚</span></div>';
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
    let towerBalance = evaluateTower([]);

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
      towerBalance = evaluateTower(tower);
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

    const towerMarkup = ({ includeMoving = false, failed = false, failureIndex = -1 } = {}) => {
      const { blocks, hidden } = visibleTower();
      const targetBottom = BASE_BOTTOM + blocks.length * BLOCK_STEP;
      const directionClass = towerBalance.direction < 0 ? 'lean-left' : towerBalance.direction > 0 ? 'lean-right' : 'lean-center';
      const localFailure = failureIndex >= hidden ? failureIndex - hidden : -1;

      return `<div class="stack-world ${failed ? 'failed' : ''}" data-stack-world>
        ${hidden ? `<div class="stack-depth">下方还有 ${hidden} 层</div>` : ''}
        <div class="stack-tower-body balance-${towerBalance.state} ${directionClass}" style="--tower-tilt:${towerBalance.tilt.toFixed(2)}deg">
          ${blocks.map((block, index) => {
            const absoluteIndex = hidden + index;
            const isTop = absoluteIndex === tower.length - 1;
            return `<div class="stack-block settled ${block.base ? 'base' : ''} ${isTop ? 'top' : ''} ${block.perfect ? 'perfect' : ''}" data-tower-index="${absoluteIndex}" style="--left:${pct(block.left)};--width:${pct(block.width)};--bottom:${BASE_BOTTOM + index * BLOCK_STEP}px" aria-hidden="true"><i></i></div>`;
          }).join('')}
          ${localFailure >= 0 ? `<div class="stack-failure-line" style="--failure-bottom:${BASE_BOTTOM + (localFailure + 1) * BLOCK_STEP - 4}px" aria-hidden="true"></div>` : ''}
        </div>
        ${includeMoving && moving ? `<div class="stack-block moving" data-moving style="--left:${pct(moving.left)};--width:${pct(moving.width)};--bottom:${targetBottom + DROP_DISTANCE}px" aria-hidden="true"><i></i></div>` : ''}
      </div>`;
    };

    const applyCamera = ({ includeMoving = false } = {}) => {
      requestAnimationFrame(() => {
        const arena = root.querySelector('.stack-arena');
        const world = root.querySelector('[data-stack-world]');
        if (!arena || !world) return;
        const visibleCount = Math.min(tower.length, MAX_VISIBLE_BLOCKS);
        const rawHeight = BASE_BOTTOM + visibleCount * BLOCK_STEP + (includeMoving ? DROP_DISTANCE + 40 : 42);
        const available = Math.max(220, arena.clientHeight - 30);
        let scale = Math.min(1, available / rawHeight);
        if (height() >= 12) scale = Math.min(scale, 0.72);
        else if (height() >= 8) scale = Math.min(scale, 0.82);
        else if (height() >= 5) scale = Math.min(scale, 0.92);
        scale = Math.max(0.68, scale);
        const shift = height() > 4 ? Math.min(28, (height() - 4) * 2.2) : 0;
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
          <p>方块左右移动时，点击画面让它落下。方块接住塔顶，并让整座塔保持稳定，就算成功。</p>
          <div class="stack-mini-rule"><span>每一块都保持原来的大小</span><span>前面留下的偏移，会影响后面的玩家</span></div>
          <button class="button primary full" data-start-game>开始叠塔</button>
        </section>`;
      bindExit(root, ctx);
      root.querySelector('[data-start-game]').onclick = beginTurn;
    };

    const beginTurn = async () => {
      if (!['intro', 'result', 'paused'].includes(phase)) return;
      const token = roundToken;
      const direction = (height() + turnIndex) % 2 === 0 ? 1 : -1;
      moving = {
        left: direction === 1 ? 0 : WORLD_WIDTH - BLOCK_WIDTH,
        width: BLOCK_WIDTH,
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
      if (state) state.textContent = '点击画面，放下方块';
      const arena = root.querySelector('[data-drop-area]');
      arena?.setAttribute('aria-disabled', 'false');
      arena?.classList.add('ready');
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
            <div class="state-${towerBalance.state}"><span>塔身状态</span><strong>${statusLabel(towerBalance.state)}</strong></div>
          </div>
          <div class="stack-instruction">
            <strong data-stack-state>${arming ? `轮到 ${escapeHtml(player.name)}，方块即将开始移动` : '点击画面，放下方块'}</strong>
            <span>方块接住后，还要保证整座塔能站稳。</span>
          </div>
          <div class="stack-arena" data-drop-area role="button" tabindex="0" aria-disabled="${arming ? 'true' : 'false'}" aria-label="点击画面放下方块">
            ${towerMarkup({ includeMoving: true })}
            <div class="stack-arena-label">点击画面任意位置放下</div>
            <div class="stack-stage-label">${escapeHtml(towerStageLabel(height()))}</div>
          </div>
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
      root.querySelector('[data-drop-area]')?.setAttribute('aria-disabled', 'true');
      root.querySelector('[data-drop-area]')?.classList.remove('ready');

      const top = topBlock();
      const movingRight = moving.left + moving.width;
      const topRight = top.left + top.width;
      const overlapLeft = Math.max(moving.left, top.left);
      const overlapRight = Math.min(movingRight, topRight);
      const overlap = Math.max(0, overlapRight - overlapLeft);
      const minimum = BLOCK_WIDTH * MIN_OVERLAP_RATIO;
      const centerGap = Math.abs((moving.left + moving.width / 2) - (top.left + top.width / 2));
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

      if (overlap < minimum) {
        tone(145, 0.2, ctx.global.sound, 0.06);
        vibrate([80, 40, 110], ctx.global.haptics);
        renderCollapse({ reason: 'miss', failureIndex: tower.length - 1, finalHeight: height(), direction: moving.direction });
        return;
      }

      const candidate = {
        left: moving.left,
        width: BLOCK_WIDTH,
        playerId: currentPlayer().id,
        base: false,
        perfect: false
      };
      const candidateTower = [...tower, candidate];
      const evaluation = evaluateTower(candidateTower);

      if (!evaluation.stable) {
        const finalHeight = height();
        tower = candidateTower;
        towerBalance = { ...evaluation, tilt: evaluation.direction * 0.95 };
        tone(132, 0.22, ctx.global.sound, 0.065);
        vibrate([90, 35, 130], ctx.global.haptics);
        renderCollapse({ reason: 'balance', failureIndex: evaluation.failureIndex, finalHeight, direction: evaluation.direction });
        return;
      }

      const perfect = centerGap <= BLOCK_WIDTH * PERFECT_RATIO && evaluation.state === 'stable';
      candidate.perfect = perfect;
      tower = candidateTower;
      towerBalance = evaluation;

      if (perfect) {
        tone(620, 0.11, ctx.global.sound, 0.045);
        vibrate([18, 25, 34], ctx.global.haptics);
      } else if (evaluation.state === 'danger') {
        tone(390, 0.12, ctx.global.sound, 0.04);
        vibrate([38, 28, 55], ctx.global.haptics);
      } else {
        tone(510, 0.08, ctx.global.sound, 0.035);
        vibrate([20, 24, 20], ctx.global.haptics);
      }
      renderSuccess({ perfect, balance: evaluation });
    };

    const renderSuccess = async ({ perfect, balance }) => {
      phase = 'result';
      const token = roundToken;
      const finisher = currentPlayer();
      const nextIndex = (turnIndex + 1) % order.length;
      const nextPlayer = order[nextIndex];
      const dangerous = balance.state === 'danger';
      const headline = perfect ? '完美叠放' : dangerous ? '危险平衡' : '放置成功';
      const detail = perfect
        ? '塔身很稳'
        : dangerous
          ? '塔已经有些偏了'
          : balance.state === 'offset'
            ? '塔身有些偏，但还能站稳'
            : '塔身保持稳定';
      const bannerClass = perfect ? 'perfect' : dangerous ? 'danger' : balance.state === 'offset' ? 'offset' : '';

      root.innerHTML = `${stageHeader(plugin.title, `塔高 ${height()} 层`)}
        <section class="game-stage stack-stage stack-success-stage">
          <div class="stack-result-banner ${bannerClass}">
            <span>${headline}</span>
            <strong>${escapeHtml(detail)}</strong>
            <small>下一位：${escapeHtml(nextPlayer.name)} · 即将自动开始</small>
          </div>
          <div class="stack-arena static">${towerMarkup()}</div>
          <div class="stack-next-player"><span>请把手机交给</span><strong>${escapeHtml(nextPlayer.name)}</strong></div>
        </section>`;
      bindExit(root, ctx);
      applyCamera();
      await wait(perfect ? 820 : dangerous ? 860 : 680);
      if (token !== roundToken || phase !== 'result') return;
      turnIndex = nextIndex;
      beginTurn();
    };

    const renderCollapse = async ({ reason, failureIndex, finalHeight, direction }) => {
      phase = 'failed';
      const loser = currentPlayer();
      const missed = reason === 'miss';
      const title = missed ? '没有接住' : '塔倒了';
      const detail = missed
        ? `${loser.name} 的方块没有落在塔顶上`
        : `${loser.name} 放下方块后，整座塔失去了平衡`;

      root.innerHTML = `${stageHeader(plugin.title, '叠塔失败')}<section class="game-stage stack-stage stack-collapse-stage">
        <div class="stack-result-banner failed"><span>${escapeHtml(title)}</span><strong>${escapeHtml(detail)}</strong><small>本局塔高 ${finalHeight} 层</small></div>
        <div class="stack-arena static failed">${towerMarkup({ includeMoving: missed, failed: true, failureIndex })}</div>
      </section>`;
      bindExit(root, ctx);
      applyCamera({ includeMoving: missed });

      const blocks = [...root.querySelectorAll('.stack-block.settled')];
      const movingNode = root.querySelector('[data-moving]');
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const fallDirection = direction < 0 ? -1 : 1;

      if (!reduced) {
        movingNode?.animate(
          [
            { transform: `translateY(${DROP_DISTANCE}px) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${fallDirection * 85}px,290px) rotate(${fallDirection * 26}deg)`, opacity: 0 }
          ],
          { duration: 720, easing: 'cubic-bezier(.35,.05,.55,1)', fill: 'forwards' }
        );
        blocks.forEach((block, index) => {
          const absoluteIndex = Number(block.dataset.towerIndex || 0);
          const unstable = reason === 'balance' && absoluteIndex > failureIndex;
          const distance = unstable ? 24 + index * 6 : 8 + index * 2;
          const opacity = unstable ? Math.max(0.12, 0.62 - index * 0.035) : 0.72;
          block.animate(
            [
              { transform: 'translate(0,0) rotate(0)', opacity: 1 },
              { transform: `translate(${fallDirection * distance}px,${unstable ? 30 + index * 7 : 12 + index * 3}px) rotate(${fallDirection * (unstable ? 7 + index * 2 : 2 + index)}deg)`, opacity }
            ],
            { duration: 620 + index * 34, delay: index * 16, easing: 'cubic-bezier(.35,.05,.55,1)', fill: 'forwards' }
          );
        });
      }

      await wait(reduced ? 180 : 940);
      renderFinal(loser, reason, finalHeight);
    };

    const renderFinal = (loser, reason, finalHeight) => {
      phase = 'final';
      const detail = reason === 'miss'
        ? `${loser.name} 的方块没有落在塔顶上。`
        : `${loser.name} 放下方块后，整座塔失去了平衡。`;
      root.innerHTML = `${stageHeader(plugin.title, '本局结束')}
        <section class="game-stage centered stack-final">
          <div class="stack-fall-mark" aria-hidden="true">▰</div>
          <span class="eyebrow">叠塔失败</span>
          <h2>${escapeHtml(loser.name)} 遭殃</h2>
          <p>${escapeHtml(detail)}本局最终叠到 ${finalHeight} 层。</p>
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
