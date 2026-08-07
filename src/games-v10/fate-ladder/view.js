import { escapeHtml } from '../../core/utils.js';
import { gameHeader } from '../../components/game-ui.js';
import { STACK_CONFIG } from './physics.js';

const pct = value => `${(value / STACK_CONFIG.worldWidth) * 100}%`;

export function towerStageLabel(height) {
  if (height < 3) return '刚刚开始';
  if (height < 7) return '塔身开始偏移';
  if (height < 12) return '需要保持平衡';
  return '临界高塔';
}

export function statusLabel(state) {
  if (state === 'danger') return '危险';
  if (state === 'offset') return '有些偏';
  return '稳定';
}

export function towerMarkup(session, {
  includeMoving = false,
  failed = false,
  failureIndex = -1
} = {}) {
  const blocks = session.tower.slice(-STACK_CONFIG.maxVisibleBlocks);
  const hidden = Math.max(0, session.tower.length - blocks.length);
  const targetBottom = STACK_CONFIG.baseBottom + blocks.length * STACK_CONFIG.blockStep;
  const directionClass = session.balance.direction < 0
    ? 'lean-left'
    : session.balance.direction > 0
      ? 'lean-right'
      : 'lean-center';
  const localFailure = failureIndex >= hidden ? failureIndex - hidden : -1;

  return `<div class="stack-world ${failed ? 'failed' : ''}" data-stack-world>
    ${hidden ? `<div class="stack-depth">下方还有 ${hidden} 层</div>` : ''}
    <div class="stack-tower-body balance-${session.balance.state} ${directionClass}" style="--tower-tilt:${session.balance.tilt.toFixed(2)}deg">
      ${blocks.map((block, index) => {
        const absoluteIndex = hidden + index;
        const isTop = absoluteIndex === session.tower.length - 1;
        return `<div class="stack-block settled ${block.base ? 'base' : ''} ${isTop ? 'top' : ''} ${block.perfect ? 'perfect' : ''}" data-tower-index="${absoluteIndex}" style="--left:${pct(block.left)};--width:${pct(block.width)};--bottom:${STACK_CONFIG.baseBottom + index * STACK_CONFIG.blockStep}px" aria-hidden="true"><i></i></div>`;
      }).join('')}
      ${localFailure >= 0 ? `<div class="stack-failure-line" style="--failure-bottom:${STACK_CONFIG.baseBottom + (localFailure + 1) * STACK_CONFIG.blockStep - 4}px" aria-hidden="true"></div>` : ''}
    </div>
    ${includeMoving && session.moving ? `<div class="stack-block moving" data-moving style="--left:${pct(session.moving.left)};--width:${pct(session.moving.width)};--bottom:${targetBottom + STACK_CONFIG.dropDistance}px" aria-hidden="true"><i></i></div>` : ''}
  </div>`;
}

export function renderIntro(plugin, session) {
  const first = session.currentPlayer();
  return `${gameHeader(plugin.title, '本局只需开始一次')}
    <section class="private-stage stack-intro-stage">
      <span class="stack-pass-icon" aria-hidden="true">▰</span>
      <span class="eyebrow">第一位玩家</span>
      <h2>${escapeHtml(first.name)}</h2>
      <p>方块左右移动时，点击画面让它落下。方块接住塔顶，并让整座塔保持稳定，就算成功。</p>
      <div class="stack-mini-rule"><span>每一块都保持原来的大小</span><span>前面留下的偏移，会影响后面的玩家</span></div>
      <button class="button primary full" data-start-game>开始叠塔</button>
    </section>`;
}

export function renderPlay(plugin, session, arming) {
  const player = session.currentPlayer();
  const nextLayer = session.height() + 1;
  return `${gameHeader(plugin.title, `${escapeHtml(player.name)} · 第 ${nextLayer} 层`)}
    <section class="game-stage stack-stage">
      <div class="stack-hud">
        <div><span>当前玩家</span><strong>${escapeHtml(player.name)}</strong></div>
        <div><span>当前塔高</span><strong>${session.height()} 层</strong></div>
        <div class="state-${session.balance.state}"><span>塔身状态</span><strong>${statusLabel(session.balance.state)}</strong></div>
      </div>
      <div class="stack-instruction">
        <strong data-stack-state>${arming ? `轮到 ${escapeHtml(player.name)}，方块即将开始移动` : '点击画面，放下方块'}</strong>
        <span>方块接住后，还要保证整座塔能站稳。</span>
      </div>
      <div class="stack-arena" data-drop-area role="button" tabindex="0" aria-disabled="${arming ? 'true' : 'false'}" aria-label="点击画面放下方块">
        ${towerMarkup(session, { includeMoving: true })}
        <div class="stack-arena-label">点击画面任意位置放下</div>
        <div class="stack-stage-label">${escapeHtml(towerStageLabel(session.height()))}</div>
      </div>
    </section>`;
}

export function renderSuccess(plugin, session, { perfect, balance, nextPlayer }) {
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

  return `${gameHeader(plugin.title, `塔高 ${session.height()} 层`)}
    <section class="game-stage stack-stage stack-success-stage">
      <div class="stack-result-banner ${bannerClass}">
        <span>${headline}</span>
        <strong>${escapeHtml(detail)}</strong>
        <small>下一位：${escapeHtml(nextPlayer.name)} · 即将自动开始</small>
      </div>
      <div class="stack-arena static">${towerMarkup(session)}</div>
      <div class="stack-next-player"><span>请把手机交给</span><strong>${escapeHtml(nextPlayer.name)}</strong></div>
    </section>`;
}

export function renderCollapse(plugin, session, { reason, finalHeight, loser, failureIndex }) {
  const missed = reason === 'miss';
  const title = missed ? '没有接住' : '塔倒了';
  const detail = missed
    ? `${loser.name} 的方块没有落在塔顶上`
    : `${loser.name} 放下方块后，整座塔失去了平衡`;

  return `${gameHeader(plugin.title, '叠塔失败')}<section class="game-stage stack-stage stack-collapse-stage">
    <div class="stack-result-banner failed"><span>${escapeHtml(title)}</span><strong>${escapeHtml(detail)}</strong><small>本局塔高 ${finalHeight} 层</small></div>
    <div class="stack-arena static failed">${towerMarkup(session, { includeMoving: missed, failed: true, failureIndex })}</div>
  </section>`;
}

export function renderFinal(plugin, session, loser, reason, finalHeight) {
  const detail = reason === 'miss'
    ? `${loser.name} 的方块没有落在塔顶上。`
    : `${loser.name} 放下方块后，整座塔失去了平衡。`;

  return `${gameHeader(plugin.title, '本局结束')}
    <section class="game-stage centered stack-final">
      <div class="stack-fall-mark" aria-hidden="true">▰</div>
      <span class="eyebrow">叠塔失败</span>
      <h2>${escapeHtml(loser.name)} 遭殃</h2>
      <p>${escapeHtml(detail)}本局最终叠到 ${finalHeight} 层。</p>
      <div class="stack-final-order"><strong>本局挑战顺序</strong><div>${session.order.map(player => `<span class="${player.id === loser.id ? 'loser' : ''}">${escapeHtml(player.name)}</span>`).join('')}</div></div>
      <button class="button primary full" data-punish>抽取惩罚</button>
      <button class="button secondary full" data-restart>再来一局</button>
    </section>`;
}

export function renderResume(plugin, session) {
  return `${gameHeader(plugin.title, `当前塔高 ${session.height()} 层`)}
    <section class="private-stage stack-intro-stage">
      <span class="stack-pass-icon" aria-hidden="true">▰</span>
      <span class="eyebrow">游戏已暂停</span>
      <h2>${escapeHtml(session.currentPlayer().name)}</h2>
      <p>页面刚刚离开前台，本次没有判定失败。点击后重新开始当前玩家的移动方块。</p>
      <button class="button primary full" data-resume>继续本回合</button>
    </section>`;
}
