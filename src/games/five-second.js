import { announce, clamp, escapeHtml, levelLabel } from './shared.js';

export function mountFiveSecond(container, context) {
  const players = context.store.activePlayers().map((player) => ({ ...player }));
  const config = { ...context.config, seconds:clamp(context.config.seconds,3,60) };
  let playerIndex = 0;
  let challengeNo = 1;
  let prompt = null;
  let loading = true;
  let error = '';
  let phase = 'ready';
  let remaining = config.seconds;
  let startedAt = 0;
  let frameId = 0;
  let lastWholeSecond = config.seconds;
  let loser = null;
  let destroyed = false;

  const currentPlayer = () => players[playerIndex];

  const render = () => {
    const player = currentPlayer();
    const progress = Math.max(0, Math.min(1, remaining / config.seconds));
    container.innerHTML = `
      <section class="game-stage timer-game">
        <div class="game-head">
          <div><small>CHALLENGE ${String(challengeNo).padStart(2,'0')}</small><h1>五秒挑战</h1></div>
          <span class="rule-pill">${config.seconds} 秒 · ${levelLabel(config.intensity)}</span>
        </div>

        <div class="player-track compact">
          ${players.map((item,index) => `
            <div class="player-chip ${index === playerIndex ? 'current' : ''}">
              <span>${escapeHtml(item.name)}</span><strong>${index === playerIndex ? '本轮' : index + 1}</strong>
            </div>
          `).join('')}
        </div>

        <section class="prompt-card amber ${loading ? 'loading' : ''}">
          <span class="prompt-label">${escapeHtml(player.name)} 的挑战</span>
          <p>${loading ? '正在抽取挑战…' : error ? escapeHtml(error) : escapeHtml(prompt?.text || '暂无挑战')}</p>
        </section>

        ${phase === 'ready' ? `
          <section class="timer-ready-card">
            <span>准备好后再点击开始</span>
            <strong>${config.seconds}</strong>
            <small>秒</small>
          </section>
          <button class="primary-button timer-primary" type="button" data-start-timer ${loading || error ? 'disabled' : ''}>开始倒计时</button>
        ` : phase === 'running' ? `
          <section class="countdown-stage" aria-live="off">
            <div class="countdown-ring" id="countdownRing" style="--timer-progress:${progress}">
              <strong id="countdownNumber">${Math.max(0, Math.ceil(remaining))}</strong>
              <small>秒</small>
            </div>
            <p>时间在走，完成后点击下方按钮。</p>
          </section>
          <button class="primary-button timer-primary" type="button" data-finish-early>已经完成</button>
        ` : phase === 'judge' ? `
          <section class="judge-card">
            <small>时间到</small>
            <h2>${escapeHtml(player.name)} 完成了吗？</h2>
            <p>由其他玩家共同判断，不需要争论太久。</p>
            <div class="judge-actions">
              <button type="button" class="success" data-judge="success">挑战成功</button>
              <button type="button" class="fail" data-judge="fail">挑战失败</button>
            </div>
          </section>
        ` : `
          <section class="game-result-card danger">
            <small>挑战失败</small>
            <h2>${escapeHtml(loser?.name || player.name)}</h2>
            <p>倒计时没有放过你，本轮需要接受惩罚。</p>
          </section>
          <div class="game-action-grid">
            <button class="secondary-button" type="button" data-next-challenge>跳过惩罚，下一位</button>
            <button class="primary-button" type="button" data-punish style="margin-top:0">查看惩罚</button>
          </div>
        `}
      </section>
    `;
  };

  const loadPrompt = async () => {
    cancelAnimationFrame(frameId);
    loading = true;
    error = '';
    prompt = null;
    phase = 'ready';
    remaining = config.seconds;
    loser = null;
    render();
    try {
      const item = await context.content.draw({ gameId:'five-second', level:config.intensity });
      if (destroyed) return;
      prompt = item;
      loading = false;
      announce(`${currentPlayer().name} 的限时挑战：${item.text}`);
    } catch (loadError) {
      console.error(loadError);
      if (destroyed) return;
      loading = false;
      error = '挑战题库加载失败，请检查部署文件。';
      context.showToast('五秒挑战题库加载失败');
    }
    render();
  };

  const finishTimer = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    remaining = 0;
    phase = 'judge';
    context.feedback.reveal();
    context.feedback.vibrate([25,35,60]);
    announce('倒计时结束，请判断挑战是否成功');
    render();
  };

  const tick = (now) => {
    if (destroyed || phase !== 'running') return;
    const elapsed = (now - startedAt) / 1000;
    remaining = Math.max(0, config.seconds - elapsed);
    const progress = remaining / config.seconds;
    const number = container.querySelector('#countdownNumber');
    const ring = container.querySelector('#countdownRing');
    if (number) number.textContent = String(Math.max(0, Math.ceil(remaining)));
    if (ring) ring.style.setProperty('--timer-progress', String(progress));

    const whole = Math.ceil(remaining);
    if (whole !== lastWholeSecond) {
      lastWholeSecond = whole;
      if (whole <= 5 && whole > 0) {
        context.feedback.tick(1 - progress);
        context.feedback.vibrate(whole <= 3 ? 10 : 5);
      }
    }

    if (remaining <= 0) finishTimer();
    else frameId = requestAnimationFrame(tick);
  };

  const startTimer = () => {
    if (loading || error || phase !== 'ready') return;
    phase = 'running';
    remaining = config.seconds;
    lastWholeSecond = config.seconds;
    startedAt = performance.now();
    context.feedback.spinStart();
    context.feedback.vibrate(12);
    render();
    frameId = requestAnimationFrame(tick);
  };

  const finishEarly = () => {
    if (phase !== 'running') return;
    cancelAnimationFrame(frameId);
    frameId = 0;
    phase = 'judge';
    render();
  };

  const nextChallenge = () => {
    playerIndex = (playerIndex + 1) % players.length;
    challengeNo += 1;
    loadPrompt();
  };

  const judge = (value) => {
    if (phase !== 'judge') return;
    if (value === 'success') {
      context.feedback.reveal();
      context.feedback.vibrate(18);
      context.showToast(`${currentPlayer().name} 挑战成功`);
      nextChallenge();
      return;
    }
    loser = currentPlayer();
    phase = 'failed';
    context.feedback.vibrate([28,45,70]);
    render();
  };

  const showPunishment = () => {
    if (!loser) return;
    context.punishment.present({ loser, level:config.intensity, onAgain:nextChallenge });
  };

  const handleClick = (event) => {
    if (event.target.closest('[data-start-timer]')) startTimer();
    if (event.target.closest('[data-finish-early]')) finishEarly();
    const judgeButton = event.target.closest('[data-judge]');
    if (judgeButton) judge(judgeButton.dataset.judge);
    if (event.target.closest('[data-next-challenge]')) nextChallenge();
    if (event.target.closest('[data-punish]')) showPunishment();
  };

  container.addEventListener('click', handleClick);
  loadPrompt();

  return () => {
    destroyed = true;
    cancelAnimationFrame(frameId);
    container.removeEventListener('click', handleClick);
  };
}
