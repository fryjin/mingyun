import {
  announce,
  escapeHtml,
  levelLabel,
  secureRandomInt,
  secureShuffle
} from './shared.js';

const SOURCE_LABELS = {
  random:'随机题库',
  custom:'国王自定'
};

export function mountKing(container, context) {
  const players = context.store.activePlayers().map((player) => ({ ...player }));
  const config = context.config;
  let round = 1;
  let assignments = [];
  let revealIndex = 0;
  let phase = 'handoff';
  let command = null;
  let commandLoading = false;
  let commandError = '';
  let targetNumbers = [];
  let customTargetCount = Math.min(2, Math.max(1, Number(config.targetCount) || 2));
  let customText = '';
  let destroyed = false;
  let requestSerial = 0;

  const currentAssignment = () => assignments[revealIndex];
  const kingAssignment = () => assignments.find((item) => item.role === 'king');
  const numberedAssignments = () => assignments.filter((item) => item.role === 'number');
  const selectedAssignments = () => targetNumbers
    .map((number) => numberedAssignments().find((item) => item.number === number))
    .filter(Boolean);

  const buildAssignments = () => {
    const roles = [
      { role:'king', number:null },
      ...Array.from({ length:players.length - 1 }, (_, index) => ({ role:'number', number:index + 1 }))
    ];
    assignments = secureShuffle(players).map((player, index) => ({
      player,
      ...roles[index]
    }));
  };

  const drawTargets = (count) => {
    const numbers = secureShuffle(numberedAssignments().map((item) => item.number));
    targetNumbers = numbers.slice(0, Math.min(count, numbers.length)).sort((a,b) => a - b);
  };

  const renderTargetBadges = () => targetNumbers
    .map((number) => `<span class="king-number-badge">${number}号</span>`)
    .join('');

  const renderedCommandText = () => {
    if (config.commandSource === 'custom') {
      return customText.trim() || '请国王向指定号码发布一项所有参与者都愿意完成的指令。';
    }
    if (!command) return '';
    return String(command.text)
      .replaceAll('{a}', `${targetNumbers[0] ?? '？'}号`)
      .replaceAll('{b}', `${targetNumbers[1] ?? '？'}号`);
  };

  const renderHandoff = () => {
    const assignment = currentAssignment();
    return `
      <section class="king-private-stage">
        <div class="king-shield" aria-hidden="true">
          <span class="king-shield-crown">♛</span>
        </div>
        <span class="king-step">身份查看 ${revealIndex + 1} / ${assignments.length}</span>
        <h2>请把手机交给</h2>
        <strong class="king-player-name">${escapeHtml(assignment.player.name)}</strong>
        <p>确认只有本人能看到屏幕后再继续。</p>
        <button class="primary-button king-gold-button" type="button" data-ready-card>手机已拿稳，查看身份</button>
      </section>
    `;
  };

  const renderCard = () => {
    const assignment = currentAssignment();
    const isKing = assignment.role === 'king';
    return `
      <section class="king-private-stage">
        <span class="king-step">仅限 ${escapeHtml(assignment.player.name)} 查看</span>
        <article class="king-role-card ${isKing ? 'is-king' : 'is-number'}">
          <div class="king-role-glow"></div>
          ${isKing
            ? `<span class="king-role-crown">♛</span><small>你的身份</small><h2>国王</h2><p>记住身份，不要告诉其他玩家。</p>`
            : `<small>你的秘密号码</small><strong class="king-role-number">${assignment.number}</strong><p>记住号码，不要让其他玩家看到。</p>`}
        </article>
        <button class="primary-button king-gold-button" type="button" data-hide-card>我记住了，收起身份</button>
        <p class="king-privacy-note">离开页面或切到后台时，身份会自动重新隐藏。</p>
      </section>
    `;
  };

  const renderKingCall = () => `
    <section class="king-private-stage king-call-stage">
      <div class="king-call-crown" aria-hidden="true">♛</div>
      <span class="king-step">所有身份已查看</span>
      <h2>国王请拿起手机</h2>
      <p>只有抽到国王的玩家点击继续。其他玩家不要查看屏幕。</p>
      <button class="primary-button king-gold-button" type="button" data-king-ready>我是国王，查看本轮指令</button>
    </section>
  `;

  const renderRandomCommand = () => `
    <section class="king-command-panel">
      <div class="king-command-head">
        <span>本轮指令</span>
        <small>${levelLabel(config.intensity)} · ${SOURCE_LABELS[config.commandSource]}</small>
      </div>
      ${commandLoading ? `
        <div class="king-command-loading"><span></span><p>正在为国王抽取指令…</p></div>
      ` : commandError ? `
        <div class="inline-warning">${escapeHtml(commandError)}</div>
        <button class="secondary-button" type="button" data-change-command>重新加载</button>
      ` : `
        <div class="king-target-badges">${renderTargetBadges()}</div>
        <p class="king-command-text">${escapeHtml(renderedCommandText())}</p>
        ${command?.consentRequired ? '<p class="king-consent-note">涉及其他玩家时必须再次确认自愿；任何人都可以直接拒绝或换题。</p>' : ''}
        <div class="game-action-grid">
          <button class="secondary-button" type="button" data-change-command>换一条指令</button>
          <button class="primary-button king-gold-button" type="button" data-reveal-targets style="margin-top:0">揭晓对应玩家</button>
        </div>
      `}
    </section>
  `;

  const renderCustomCommand = () => `
    <section class="king-command-panel">
      <div class="king-command-head">
        <span>国王自定指令</span>
        <small>由系统随机抽取目标号码</small>
      </div>
      <div class="king-target-count">
        <span>目标人数</span>
        <div class="segmented">
          <button type="button" data-target-count="1" class="${customTargetCount === 1 ? 'active' : ''}">1 人</button>
          <button type="button" data-target-count="2" class="${customTargetCount === 2 ? 'active' : ''}">2 人</button>
        </div>
      </div>
      <label class="king-custom-label">
        <span>指令内容 <small>可留空并口头发布</small></span>
        <textarea data-custom-command maxlength="80" placeholder="输入一项所有人都愿意完成的指令…">${escapeHtml(customText)}</textarea>
      </label>
      ${targetNumbers.length ? `<div class="king-target-badges">${renderTargetBadges()}</div>` : '<p class="king-empty-target">点击下方按钮随机抽取目标号码。</p>'}
      <p class="king-consent-note">国王不能要求危险、羞辱、强迫饮酒、公开隐私或未经同意的身体接触。</p>
      <div class="game-action-grid">
        <button class="secondary-button" type="button" data-draw-targets>${targetNumbers.length ? '重新抽号' : '抽取号码'}</button>
        <button class="primary-button king-gold-button" type="button" data-reveal-targets style="margin-top:0" ${targetNumbers.length ? '' : 'disabled'}>揭晓对应玩家</button>
      </div>
    </section>
  `;

  const renderCommand = () => `
    <section class="king-command-stage">
      <div class="king-stage-crown" aria-hidden="true">♛</div>
      <div class="king-stage-title">
        <small>ROUND ${String(round).padStart(2,'0')}</small>
        <h2>国王发布命令</h2>
        <p>国王：${escapeHtml(kingAssignment()?.player.name || '')}</p>
      </div>
      ${config.commandSource === 'random' ? renderRandomCommand() : renderCustomCommand()}
    </section>
  `;

  const renderReveal = () => {
    const targets = selectedAssignments();
    return `
      <section class="king-reveal-stage">
        <span class="king-step">号码揭晓</span>
        <div class="king-target-badges large">${renderTargetBadges()}</div>
        <p class="king-command-text reveal">${escapeHtml(renderedCommandText())}</p>
        <div class="king-reveal-grid">
          ${targets.map((item) => `
            <article class="king-reveal-player">
              <span>${item.number}号</span>
              <strong>${escapeHtml(item.player.name)}</strong>
            </article>
          `).join('')}
        </div>
        <p class="king-consent-note">指令可以跳过、替换或改成不接触版本，不需要解释原因。</p>
        <div class="game-action-grid">
          <button class="secondary-button" type="button" data-back-command>${config.commandSource === 'random' ? '换一条指令' : '重新编辑'}</button>
          <button class="primary-button king-gold-button" type="button" data-next-round style="margin-top:0">完成，开始下一轮</button>
        </div>
      </section>
    `;
  };

  const render = () => {
    container.innerHTML = `
      <section class="game-stage king-game">
        <div class="game-head">
          <div><small>ROUND ${String(round).padStart(2,'0')}</small><h1>国王游戏</h1></div>
          <span class="rule-pill">${levelLabel(config.intensity)} · ${SOURCE_LABELS[config.commandSource]}</span>
        </div>
        ${phase === 'handoff' ? renderHandoff() : ''}
        ${phase === 'card' ? renderCard() : ''}
        ${phase === 'king-call' ? renderKingCall() : ''}
        ${phase === 'command' ? renderCommand() : ''}
        ${phase === 'reveal' ? renderReveal() : ''}
      </section>
    `;
  };

  const loadRandomCommand = async () => {
    requestSerial += 1;
    const requestId = requestSerial;
    commandLoading = true;
    commandError = '';
    command = null;
    targetNumbers = [];
    render();
    try {
      const item = await context.content.draw({ gameId:'king', level:config.intensity });
      if (destroyed || requestId !== requestSerial) return;
      command = item;
      drawTargets(Math.min(2, Math.max(1, Number(item.targetCount) || 1)));
      commandLoading = false;
      announce(`国王指令：${renderedCommandText()}`);
    } catch (error) {
      console.error(error);
      if (destroyed || requestId !== requestSerial) return;
      commandLoading = false;
      commandError = '国王指令加载失败，请检查部署文件后重试。';
      context.showToast('国王游戏题库加载失败');
    }
    render();
  };

  const startRound = () => {
    requestSerial += 1;
    buildAssignments();
    revealIndex = 0;
    phase = 'handoff';
    command = null;
    commandLoading = false;
    commandError = '';
    targetNumbers = [];
    customText = '';
    render();
    announce(`国王游戏第 ${round} 轮开始，请把手机交给 ${currentAssignment().player.name}`);
  };

  const showCard = () => {
    phase = 'card';
    context.feedback.ui();
    context.feedback.vibrate(8);
    render();
  };

  const hideCard = () => {
    if (revealIndex < assignments.length - 1) {
      revealIndex += 1;
      phase = 'handoff';
      announce(`请把手机交给 ${currentAssignment().player.name}`);
    } else {
      phase = 'king-call';
      announce('所有身份已经查看，国王请拿起手机');
      context.feedback.reveal();
      context.feedback.vibrate([18,28,42]);
    }
    render();
  };

  const enterCommand = () => {
    phase = 'command';
    context.feedback.ui();
    if (config.commandSource === 'random') loadRandomCommand();
    else render();
  };

  const revealTargets = () => {
    if (!targetNumbers.length) {
      context.showToast('请先抽取目标号码');
      return;
    }
    phase = 'reveal';
    context.feedback.reveal();
    context.feedback.vibrate([22,34,54]);
    announce(`目标玩家：${selectedAssignments().map((item) => item.player.name).join('、')}`);
    render();
  };

  const backToCommand = () => {
    phase = 'command';
    if (config.commandSource === 'random') loadRandomCommand();
    else render();
  };

  const nextRound = () => {
    round += 1;
    startRound();
  };

  const handleClick = (event) => {
    if (event.target.closest('[data-ready-card]')) showCard();
    if (event.target.closest('[data-hide-card]')) hideCard();
    if (event.target.closest('[data-king-ready]')) enterCommand();
    if (event.target.closest('[data-change-command]')) loadRandomCommand();

    const targetCount = event.target.closest('[data-target-count]');
    if (targetCount) {
      customTargetCount = Number(targetCount.dataset.targetCount) || 1;
      targetNumbers = [];
      render();
    }

    if (event.target.closest('[data-draw-targets]')) {
      drawTargets(customTargetCount);
      context.feedback.ui();
      render();
    }
    if (event.target.closest('[data-reveal-targets]')) revealTargets();
    if (event.target.closest('[data-back-command]')) backToCommand();
    if (event.target.closest('[data-next-round]')) nextRound();
  };

  const handleInput = (event) => {
    if (event.target.matches('[data-custom-command]')) customText = event.target.value;
  };

  const handleVisibility = () => {
    if (document.hidden && phase === 'card') {
      phase = 'handoff';
      render();
    }
  };

  container.addEventListener('click', handleClick);
  container.addEventListener('input', handleInput);
  document.addEventListener('visibilitychange', handleVisibility);
  startRound();

  return () => {
    destroyed = true;
    requestSerial += 1;
    container.removeEventListener('click', handleClick);
    container.removeEventListener('input', handleInput);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
