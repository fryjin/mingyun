import { announce, escapeHtml, levelLabel, secureRandomInt } from './shared.js';

const DURATION_RANGES = {
  short:[30,60],
  standard:[60,120],
  long:[120,180]
};

export function mountHotPotato(container, context) {
  const players = context.store.activePlayers().map((player) => ({ ...player }));
  const config = context.config;
  let round = 1;
  let currentIndex = secureRandomInt(players.length);
  let actualDirection = resolveDirection(config.direction);
  let phase = 'ready';
  let prompt = null;
  let promptLoading = true;
  let promptError = '';
  let passCount = 0;
  let loser = null;
  let startedAt = 0;
  let durationMs = 0;
  let explosionTimer = 0;
  let frameId = 0;
  let passLocked = false;
  let destroyed = false;

  const currentPlayer = () => players[currentIndex];
  const nextIndex = () => (currentIndex + actualDirection + players.length) % players.length;

  const render = () => {
    const current = currentPlayer();
    const next = players[nextIndex()];
    container.innerHTML = `
      <section class="game-stage bomb-game">
        <div class="game-head">
          <div><small>ROUND ${String(round).padStart(2,'0')}</small><h1>炸弹传递</h1></div>
          <span class="rule-pill">${levelLabel(config.intensity)} · ${actualDirection > 0 ? '顺时针' : '逆时针'}</span>
        </div>

        <section class="bomb-stage ${phase}">
          <div class="bomb-aura"></div>
          <div class="bomb-core" id="bombCore" style="--bomb-progress:0">
            <span class="bomb-fuse"></span>
            <span class="bomb-shine"></span>
            <strong>${phase === 'exploded' ? 'BOOM' : phase === 'running' ? 'LIVE' : 'READY'}</strong>
          </div>
          <div class="bomb-holder">
            <small>${phase === 'exploded' ? '爆炸时持有者' : phase === 'running' ? '当前持有者' : '起始玩家'}</small>
            <h2>${escapeHtml(current.name)}</h2>
            <p>${phase === 'running' ? `已传递 ${passCount} 次 · 下一位 ${escapeHtml(next.name)}` : phase === 'ready' ? '准备好后点击开始，倒计时不会显示。' : '命运已经锁定，本轮无法继续传递。'}</p>
          </div>
        </section>

        ${phase !== 'exploded' ? `
          <section class="prompt-card red ${promptLoading ? 'loading' : ''}">
            <span class="prompt-label">传递前任务</span>
            <p>${promptLoading ? '正在抽取任务…' : promptError ? escapeHtml(promptError) : escapeHtml(prompt?.text || '暂无任务')}</p>
          </section>
        ` : `
          <section class="game-result-card danger">
            <small>炸弹引爆</small>
            <h2>${escapeHtml(loser?.name || current.name)}</h2>
            <p>手机留在了你手上，本轮由你接受惩罚。</p>
          </section>
        `}

        ${phase === 'ready' ? `
          <button class="primary-button bomb-primary" type="button" data-start-bomb ${promptLoading || promptError ? 'disabled' : ''}>点燃炸弹</button>
          <p class="safety-note">传递手机，不要抛掷手机。开始后不会显示剩余秒数。</p>
        ` : phase === 'running' ? `
          <button class="primary-button bomb-primary" type="button" data-pass-bomb ${passLocked || promptLoading ? 'disabled' : ''}>${promptLoading ? '正在准备下一题…' : `完成回答，传给 ${escapeHtml(next.name)}`}</button>
          <p class="safety-note">回答或完成任务后再传递；炸弹可能在任何时刻引爆。</p>
        ` : `
          <div class="game-action-grid">
            <button class="secondary-button" type="button" data-next-round>跳过惩罚，再来一轮</button>
            <button class="primary-button" type="button" data-punish style="margin-top:0">查看惩罚</button>
          </div>
        `}
      </section>
    `;
  };

  const loadPrompt = async () => {
    promptLoading = true;
    promptError = '';
    render();
    try {
      const item = await context.content.draw({ gameId:'hot-potato', level:config.intensity });
      if (destroyed || phase === 'exploded') return;
      prompt = item;
      promptLoading = false;
      announce(`${currentPlayer().name} 的传递任务：${item.text}`);
    } catch (loadError) {
      console.error(loadError);
      if (destroyed || phase === 'exploded') return;
      promptLoading = false;
      promptError = '任务加载失败，请检查部署文件。';
      context.showToast('炸弹传递题库加载失败');
    }
    render();
  };

  const animateBomb = (now) => {
    if (destroyed || phase !== 'running') return;
    const progress = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
    const core = container.querySelector('#bombCore');
    if (core) core.style.setProperty('--bomb-progress', String(progress));
    frameId = requestAnimationFrame(animateBomb);
  };

  const explode = () => {
    if (destroyed || phase !== 'running') return;
    phase = 'exploded';
    loser = currentPlayer();
    clearTimeout(explosionTimer);
    cancelAnimationFrame(frameId);
    context.feedback.reveal();
    context.feedback.vibrate([45,35,90,35,120]);
    announce(`炸弹在 ${loser.name} 手中引爆`);
    render();
  };

  const start = () => {
    if (phase !== 'ready' || promptLoading || promptError) return;
    const [minimum,maximum] = DURATION_RANGES[config.duration] || DURATION_RANGES.standard;
    durationMs = (minimum + secureRandomInt(maximum - minimum + 1)) * 1000;
    startedAt = performance.now();
    phase = 'running';
    context.feedback.spinStart();
    context.feedback.vibrate([15,25,15]);
    explosionTimer = window.setTimeout(explode, durationMs);
    render();
    frameId = requestAnimationFrame(animateBomb);
  };

  const pass = () => {
    if (phase !== 'running' || passLocked || promptLoading) return;
    passLocked = true;
    currentIndex = nextIndex();
    passCount += 1;
    context.feedback.ui();
    context.feedback.vibrate(8);
    prompt = null;
    const unlockAt = performance.now() + 420;
    loadPrompt().finally(() => {
      const wait = Math.max(0, unlockAt - performance.now());
      window.setTimeout(() => {
        passLocked = false;
        if (!destroyed && phase === 'running') render();
      }, wait);
    });
  };

  const resetRound = () => {
    clearTimeout(explosionTimer);
    cancelAnimationFrame(frameId);
    round += 1;
    currentIndex = secureRandomInt(players.length);
    actualDirection = resolveDirection(config.direction);
    phase = 'ready';
    prompt = null;
    passCount = 0;
    loser = null;
    passLocked = false;
    loadPrompt();
  };

  const showPunishment = () => {
    if (!loser) return;
    context.punishment.present({ loser, level:config.intensity, onAgain:resetRound });
  };

  const handleClick = (event) => {
    if (event.target.closest('[data-start-bomb]')) start();
    if (event.target.closest('[data-pass-bomb]')) pass();
    if (event.target.closest('[data-next-round]')) resetRound();
    if (event.target.closest('[data-punish]')) showPunishment();
  };

  container.addEventListener('click', handleClick);
  loadPrompt();

  return () => {
    destroyed = true;
    clearTimeout(explosionTimer);
    cancelAnimationFrame(frameId);
    container.removeEventListener('click', handleClick);
  };
}

function resolveDirection(direction) {
  if (direction === 'counter') return -1;
  if (direction === 'random') return secureRandomInt(2) === 0 ? -1 : 1;
  return 1;
}
