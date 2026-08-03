import {
  announce,
  escapeHtml,
  randomChoice,
  secureRandomInt,
  secureShuffle
} from './shared.js';

const DIFFICULTY_LABELS = { 1:'轻松', 2:'标准', 3:'烧脑' };
const ROLE_LABELS = { civilian:'平民', undercover:'卧底', blank:'空白牌' };

export function mountUndercover(container, context) {
  const basePlayers = context.store.activePlayers().map((player) => ({ ...player }));
  const config = {
    spyCount:Math.max(1, Number(context.config.spyCount) || 1),
    blankCard:Boolean(context.config.blankCard),
    wordDifficulty:Math.min(3, Math.max(1, Number(context.config.wordDifficulty) || 2)),
    guessChance:context.config.guessChance !== false
  };

  let phase = 'loading';
  let round = 1;
  let wordPair = null;
  let assignments = [];
  let revealIndex = 0;
  let speakingOrder = [];
  let speakerIndex = 0;
  let voteOrder = [];
  let voteIndex = 0;
  let voteChoice = null;
  let votes = [];
  let restrictedCandidates = null;
  let tiedCandidates = [];
  let tieDepth = 0;
  let eliminated = null;
  let afterElimination = 'next';
  let winner = null;
  let guessText = '';
  let loadError = '';
  let requestSerial = 0;
  let destroyed = false;

  const alive = () => assignments.filter((item) => item.alive);
  const hiddenAlive = () => alive().filter((item) => item.role !== 'civilian');
  const civiliansAlive = () => alive().filter((item) => item.role === 'civilian');
  const currentReveal = () => assignments[revealIndex];
  const currentSpeaker = () => speakingOrder[speakerIndex];
  const currentVoter = () => voteOrder[voteIndex];
  const isHidden = (item) => item.role !== 'civilian';

  const normalizedSpyCount = () => {
    const count = basePlayers.length >= 9 ? 3 : basePlayers.length >= 6 ? 2 : 1;
    return Math.min(count, config.spyCount);
  };

  const buildAssignments = () => {
    const hiddenCount = normalizedSpyCount();
    const hiddenRoles = Array.from({ length:hiddenCount }, () => 'undercover');
    if (config.blankCard) hiddenRoles[hiddenRoles.length - 1] = 'blank';
    const roles = secureShuffle([
      ...hiddenRoles,
      ...Array.from({ length:basePlayers.length - hiddenCount }, () => 'civilian')
    ]);
    assignments = secureShuffle(basePlayers).map((player,index) => ({
      player,
      role:roles[index],
      word:roles[index] === 'civilian' ? wordPair.civilianWord : roles[index] === 'undercover' ? wordPair.undercoverWord : '',
      alive:true
    }));
  };

  const startSpeakingRound = () => {
    speakingOrder = secureShuffle(alive());
    speakerIndex = 0;
    phase = 'round-intro';
    announce(`第 ${round} 轮发言即将开始，首位玩家是 ${speakingOrder[0].player.name}`);
    render();
  };

  const startVote = (candidateIds = null) => {
    voteOrder = secureShuffle(alive());
    voteIndex = 0;
    voteChoice = null;
    votes = [];
    restrictedCandidates = candidateIds ? [...candidateIds] : null;
    phase = 'vote-handoff';
    announce(`开始投票，请把手机交给 ${currentVoter().player.name}`);
    render();
  };

  const availableVoteTargets = () => alive().filter((item) => {
    if (item.player.id === currentVoter()?.player.id) return false;
    return !restrictedCandidates || restrictedCandidates.includes(item.player.id);
  });

  const countVotes = () => {
    const counts = new Map(alive().map((item) => [item.player.id,0]));
    votes.forEach((vote) => counts.set(vote.targetId,(counts.get(vote.targetId) || 0) + 1));
    return counts;
  };

  const finishVote = () => {
    const counts = countVotes();
    const maxVotes = Math.max(...counts.values());
    const top = alive().filter((item) => counts.get(item.player.id) === maxVotes);
    if (top.length > 1 && tieDepth === 0) {
      tiedCandidates = top;
      phase = 'tie';
      announce(`出现平票：${top.map((item) => item.player.name).join('、')}`);
      render();
      return;
    }
    const target = top.length > 1 ? randomChoice(top) : top[0];
    eliminate(target, top.length > 1);
  };

  const evaluateWinner = () => {
    if (hiddenAlive().length === 0) return 'civilian';
    if (hiddenAlive().length >= civiliansAlive().length) return 'hidden';
    return null;
  };

  const eliminate = (target, randomTie = false) => {
    target.alive = false;
    eliminated = target;
    const result = evaluateWinner();
    if (result === 'civilian' && isHidden(target) && config.guessChance) {
      afterElimination = 'guess';
    } else if (result) {
      winner = result;
      afterElimination = 'result';
    } else {
      afterElimination = 'next';
    }
    phase = 'elimination';
    context.feedback.reveal();
    context.feedback.vibrate([24,35,55]);
    announce(`${target.player.name} 被淘汰，身份是 ${ROLE_LABELS[target.role]}${randomTie ? '，本次由系统随机决胜' : ''}`);
    render();
  };

  const loadNewGame = async () => {
    requestSerial += 1;
    const requestId = requestSerial;
    phase = 'loading';
    loadError = '';
    wordPair = null;
    render();
    try {
      const item = await context.content.draw({ gameId:'undercover', level:config.wordDifficulty });
      if (destroyed || requestId !== requestSerial) return;
      wordPair = item;
      round = 1;
      revealIndex = 0;
      winner = null;
      eliminated = null;
      guessText = '';
      tieDepth = 0;
      buildAssignments();
      phase = 'handoff';
      announce(`新牌局开始，请把手机交给 ${currentReveal().player.name}`);
    } catch (error) {
      console.error(error);
      if (destroyed || requestId !== requestSerial) return;
      loadError = '词库加载失败，请检查部署文件或网络后重试。';
      phase = 'loading';
      context.showToast('谁是卧底词库加载失败');
    }
    render();
  };

  const renderLoading = () => `
    <section class="undercover-loading">
      <span class="undercover-mask-mark" aria-hidden="true">◑</span>
      <h2>${loadError ? '未能开始牌局' : '正在准备秘密词语'}</h2>
      <p>${loadError ? escapeHtml(loadError) : `${DIFFICULTY_LABELS[config.wordDifficulty]}词库 · 正在洗牌并分配身份`}</p>
      ${loadError ? '<button class="primary-button undercover-primary" type="button" data-retry-undercover>重新加载</button>' : '<span class="undercover-spinner" aria-hidden="true"></span>'}
    </section>`;

  const renderHandoff = () => `
    <section class="undercover-private-stage">
      <div class="undercover-card-back" aria-hidden="true"><span>?</span></div>
      <span class="undercover-step">秘密看词 ${revealIndex + 1} / ${assignments.length}</span>
      <h2>请把手机交给</h2>
      <strong class="undercover-player-name">${escapeHtml(currentReveal().player.name)}</strong>
      <p>确认只有本人能看到屏幕后再继续。</p>
      <button class="primary-button undercover-primary" type="button" data-role-ready>手机已拿稳，查看词语</button>
    </section>`;

  const renderRoleCard = () => {
    const item = currentReveal();
    return `
      <section class="undercover-private-stage">
        <span class="undercover-step">仅限 ${escapeHtml(item.player.name)} 查看</span>
        <article class="undercover-word-card ${item.role === 'blank' ? 'is-blank' : ''}">
          <small>${item.role === 'blank' ? '你的词语' : '请记住这个词'}</small>
          <strong>${item.role === 'blank' ? '空白牌' : escapeHtml(item.word)}</strong>
          <p>${item.role === 'blank' ? '你没有词语。根据其他人的描述隐藏自己。' : '不要让其他玩家看到，也不要直接说出词语。'}</p>
        </article>
        <button class="primary-button undercover-primary" type="button" data-hide-role>我记住了，收起词语</button>
        <p class="undercover-privacy-note">切到后台时会自动重新隐藏词语。</p>
      </section>`;
  };

  const aliveChips = (highlightId = null) => alive().map((item) => `
    <span class="undercover-alive-chip ${highlightId === item.player.id ? 'active' : ''}">${escapeHtml(item.player.name)}</span>
  `).join('');

  const renderRoundIntro = () => `
    <section class="undercover-round-panel">
      <span class="undercover-step">ROUND ${String(round).padStart(2,'0')}</span>
      <div class="undercover-round-orb" aria-hidden="true">${round}</div>
      <h2>开始轮流描述</h2>
      <p>从 <strong>${escapeHtml(speakingOrder[0].player.name)}</strong> 开始。描述要有关联，但不能直接说出词语。</p>
      <div class="undercover-alive-list">${aliveChips(speakingOrder[0].player.id)}</div>
      <button class="primary-button undercover-primary" type="button" data-start-speaking>开始本轮发言</button>
    </section>`;

  const renderSpeaking = () => {
    const speaker = currentSpeaker();
    return `
      <section class="undercover-speaking-panel">
        <span class="undercover-step">发言 ${speakerIndex + 1} / ${speakingOrder.length}</span>
        <div class="undercover-speaker-avatar">${escapeHtml(speaker.player.name.slice(0,1))}</div>
        <small>现在轮到</small>
        <h2>${escapeHtml(speaker.player.name)}</h2>
        <p>用一句话描述自己的词语。不要重复别人已经说过的内容。</p>
        <div class="undercover-order-list">
          ${speakingOrder.map((item,index) => `<span class="${index === speakerIndex ? 'current' : index < speakerIndex ? 'done' : ''}">${escapeHtml(item.player.name)}</span>`).join('')}
        </div>
        <button class="primary-button undercover-primary" type="button" data-next-speaker>${speakerIndex === speakingOrder.length - 1 ? '发言结束，进入投票' : '下一位玩家'}</button>
      </section>`;
  };

  const renderVoteHandoff = () => `
    <section class="undercover-private-stage">
      <div class="undercover-vote-icon" aria-hidden="true">✓</div>
      <span class="undercover-step">投票 ${voteIndex + 1} / ${voteOrder.length}${restrictedCandidates ? ' · 平票加赛' : ''}</span>
      <h2>请把手机交给</h2>
      <strong class="undercover-player-name">${escapeHtml(currentVoter().player.name)}</strong>
      <p>每位在场玩家秘密投出一票，不能投给自己。</p>
      <button class="primary-button undercover-primary" type="button" data-vote-ready>开始秘密投票</button>
    </section>`;

  const renderVoteSelect = () => `
    <section class="undercover-vote-panel">
      <span class="undercover-step">${escapeHtml(currentVoter().player.name)} 的秘密投票</span>
      <h2>${restrictedCandidates ? '从平票玩家中选择' : '谁最像卧底？'}</h2>
      <p>选择后还需要再次确认。其他玩家不要看屏幕。</p>
      <div class="undercover-vote-grid">
        ${availableVoteTargets().map((item) => `
          <button type="button" data-vote-target="${escapeHtml(item.player.id)}" class="${voteChoice === item.player.id ? 'selected' : ''}">
            <span>${escapeHtml(item.player.name.slice(0,1))}</span><strong>${escapeHtml(item.player.name)}</strong>
          </button>`).join('')}
      </div>
      <button class="primary-button undercover-primary" type="button" data-confirm-vote ${voteChoice ? '' : 'disabled'}>确认投票并隐藏</button>
    </section>`;

  const renderTie = () => `
    <section class="undercover-tie-panel">
      <span class="undercover-step">本轮平票</span>
      <div class="undercover-tie-icon" aria-hidden="true">≋</div>
      <h2>需要加赛投票</h2>
      <p>${tiedCandidates.map((item) => escapeHtml(item.player.name)).join('、')} 获得相同最高票。</p>
      <div class="undercover-alive-list">${tiedCandidates.map((item) => `<span class="undercover-alive-chip active">${escapeHtml(item.player.name)}</span>`).join('')}</div>
      <button class="primary-button undercover-primary" type="button" data-start-tiebreak>只对平票玩家重新投票</button>
      <p class="undercover-privacy-note">再次平票时，系统会从平票玩家中随机淘汰一人。</p>
    </section>`;

  const renderElimination = () => `
    <section class="undercover-elimination-panel">
      <span class="undercover-step">淘汰结果</span>
      <div class="undercover-eliminated-avatar">${escapeHtml(eliminated.player.name.slice(0,1))}</div>
      <h2>${escapeHtml(eliminated.player.name)}</h2>
      <p>本轮身份是</p>
      <strong class="undercover-role-result ${isHidden(eliminated) ? 'hidden' : ''}">${ROLE_LABELS[eliminated.role]}</strong>
      <div class="undercover-survivors">
        <span>在场平民 <b>${civiliansAlive().length}</b></span>
        <span>隐藏阵营 <b>${hiddenAlive().length}</b></span>
      </div>
      <button class="primary-button undercover-primary" type="button" data-after-elimination>${afterElimination === 'next' ? '继续下一轮' : afterElimination === 'guess' ? '卧底进行最后猜词' : '查看最终结果'}</button>
    </section>`;

  const renderGuess = () => `
    <section class="undercover-guess-panel">
      <span class="undercover-step">最后翻盘机会</span>
      <h2>${escapeHtml(eliminated.player.name)} 猜平民词</h2>
      <p>最后一位隐藏阵营玩家可以猜一次平民词。由全员判断是否正确。</p>
      <label><span>猜测内容 <small>也可以口头作答</small></span><input data-guess-input maxlength="12" value="${escapeHtml(guessText)}" placeholder="输入猜测词语"></label>
      <div class="undercover-guess-actions">
        <button type="button" data-guess-result="wrong">猜错了</button>
        <button type="button" data-guess-result="correct">猜对了</button>
      </div>
    </section>`;

  const renderResult = () => `
    <section class="undercover-result-panel ${winner === 'hidden' ? 'hidden-win' : ''}">
      <span class="undercover-step">牌局结束</span>
      <div class="undercover-result-mark" aria-hidden="true">${winner === 'hidden' ? '◐' : '✓'}</div>
      <h2>${winner === 'hidden' ? '隐藏阵营获胜' : '平民阵营获胜'}</h2>
      <div class="undercover-word-reveal">
        <span>平民词<strong>${escapeHtml(wordPair.civilianWord)}</strong></span>
        <span>卧底词<strong>${escapeHtml(wordPair.undercoverWord)}</strong></span>
      </div>
      <div class="undercover-role-grid">
        ${assignments.map((item) => `<article class="${isHidden(item) ? 'hidden' : ''}"><span>${escapeHtml(item.player.name)}</span><strong>${ROLE_LABELS[item.role]}</strong></article>`).join('')}
      </div>
      <button class="primary-button undercover-primary" type="button" data-new-undercover>换一组词，再开一局</button>
    </section>`;

  const render = () => {
    container.innerHTML = `
      <section class="game-stage undercover-game">
        <div class="game-head">
          <div><small>${phase === 'loading' ? 'NEW GAME' : `ROUND ${String(round).padStart(2,'0')}`}</small><h1>谁是卧底</h1></div>
          <span class="rule-pill">${DIFFICULTY_LABELS[config.wordDifficulty]} · ${normalizedSpyCount()}位隐藏</span>
        </div>
        ${phase === 'loading' ? renderLoading() : ''}
        ${phase === 'handoff' ? renderHandoff() : ''}
        ${phase === 'role-card' ? renderRoleCard() : ''}
        ${phase === 'round-intro' ? renderRoundIntro() : ''}
        ${phase === 'speaking' ? renderSpeaking() : ''}
        ${phase === 'vote-handoff' ? renderVoteHandoff() : ''}
        ${phase === 'vote-select' ? renderVoteSelect() : ''}
        ${phase === 'tie' ? renderTie() : ''}
        ${phase === 'elimination' ? renderElimination() : ''}
        ${phase === 'guess' ? renderGuess() : ''}
        ${phase === 'result' ? renderResult() : ''}
      </section>`;
  };

  const onClick = (event) => {
    if (event.target.closest('[data-retry-undercover]')) loadNewGame();
    if (event.target.closest('[data-role-ready]')) { phase = 'role-card'; context.feedback.ui(); render(); }
    if (event.target.closest('[data-hide-role]')) {
      if (revealIndex < assignments.length - 1) {
        revealIndex += 1; phase = 'handoff'; announce(`请把手机交给 ${currentReveal().player.name}`); render();
      } else startSpeakingRound();
    }
    if (event.target.closest('[data-start-speaking]')) { phase = 'speaking'; render(); }
    if (event.target.closest('[data-next-speaker]')) {
      if (speakerIndex < speakingOrder.length - 1) { speakerIndex += 1; announce(`轮到 ${currentSpeaker().player.name} 发言`); render(); }
      else { tieDepth = 0; startVote(); }
    }
    if (event.target.closest('[data-vote-ready]')) { phase = 'vote-select'; voteChoice = null; render(); }
    const targetButton = event.target.closest('[data-vote-target]');
    if (targetButton) { voteChoice = targetButton.dataset.voteTarget; context.feedback.ui(); render(); }
    if (event.target.closest('[data-confirm-vote]') && voteChoice) {
      votes.push({ voterId:currentVoter().player.id, targetId:voteChoice });
      voteChoice = null;
      context.feedback.vibrate(8);
      if (voteIndex < voteOrder.length - 1) { voteIndex += 1; phase = 'vote-handoff'; announce(`请把手机交给 ${currentVoter().player.name}`); render(); }
      else finishVote();
    }
    if (event.target.closest('[data-start-tiebreak]')) { tieDepth = 1; startVote(tiedCandidates.map((item) => item.player.id)); }
    if (event.target.closest('[data-after-elimination]')) {
      if (afterElimination === 'guess') { phase = 'guess'; render(); }
      else if (afterElimination === 'result') { phase = 'result'; render(); }
      else { round += 1; startSpeakingRound(); }
    }
    const guessButton = event.target.closest('[data-guess-result]');
    if (guessButton) { winner = guessButton.dataset.guessResult === 'correct' ? 'hidden' : 'civilian'; phase = 'result'; context.feedback.reveal(); render(); }
    if (event.target.closest('[data-new-undercover]')) loadNewGame();
  };

  const onInput = (event) => {
    if (event.target.matches('[data-guess-input]')) guessText = event.target.value.slice(0,12);
  };

  const onVisibility = () => {
    if (!document.hidden) return;
    if (phase === 'role-card') { phase = 'handoff'; render(); }
    if (phase === 'vote-select') { voteChoice = null; phase = 'vote-handoff'; render(); }
  };

  container.addEventListener('click',onClick);
  container.addEventListener('input',onInput);
  document.addEventListener('visibilitychange',onVisibility);
  loadNewGame();

  return () => {
    destroyed = true;
    requestSerial += 1;
    container.removeEventListener('click',onClick);
    container.removeEventListener('input',onInput);
    document.removeEventListener('visibilitychange',onVisibility);
  };
}
