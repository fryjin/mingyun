import { announce, escapeHtml, levelLabel, secureRandomInt } from './shared.js';

const RULE_LABELS = {
  minority:'少数派受罚',
  majority:'多数派受罚',
  explain:'随机解释'
};

export function mountWouldRather(container, context) {
  const players = context.store.activePlayers().map((player) => ({ ...player }));
  const config = context.config;
  let round = 1;
  let prompt = null;
  let loading = true;
  let error = '';
  let turn = 0;
  let choices = [];
  let result = null;
  let destroyed = false;

  const counts = () => ({
    A:choices.filter((choice) => choice.value === 'A').length,
    B:choices.filter((choice) => choice.value === 'B').length
  });

  const render = () => {
    const tally = counts();
    const current = players[turn];
    container.innerHTML = `
      <section class="game-stage choice-game">
        <div class="game-head">
          <div><small>ROUND ${String(round).padStart(2,'0')}</small><h1>二选一</h1></div>
          <span class="rule-pill">${levelLabel(config.intensity)} · ${RULE_LABELS[config.settleRule]}</span>
        </div>

        ${loading || error ? `
          <section class="prompt-card blue ${loading ? 'loading' : ''}">
            <span class="prompt-label">本轮选择</span>
            <p>${loading ? '正在抽取题目…' : escapeHtml(error)}</p>
          </section>
        ` : `
          <section class="choice-board ${result ? 'settled' : ''}">
            <article class="choice-option option-a">
              <span>A</span><p>${escapeHtml(prompt.optionA)}</p><strong>${tally.A} 人</strong>
            </article>
            <div class="choice-versus">OR</div>
            <article class="choice-option option-b">
              <span>B</span><p>${escapeHtml(prompt.optionB)}</p><strong>${tally.B} 人</strong>
            </article>
          </section>
        `}

        ${result ? `
          <section class="game-result-card">
            <small>${escapeHtml(result.kicker)}</small>
            <h2>${escapeHtml(result.player.name)}</h2>
            <p>${escapeHtml(result.message)}</p>
          </section>
          <div class="choice-team-summary">
            <div><b>A · ${tally.A}</b><span>${choices.filter((item) => item.value === 'A').map((item) => escapeHtml(item.player.name)).join('、') || '无人'}</span></div>
            <div><b>B · ${tally.B}</b><span>${choices.filter((item) => item.value === 'B').map((item) => escapeHtml(item.player.name)).join('、') || '无人'}</span></div>
          </div>
          <div class="game-action-grid">
            <button class="secondary-button" type="button" data-next-round>${config.settleRule === 'explain' ? '解释完毕，下一题' : '跳过惩罚，下一题'}</button>
            <button class="primary-button" type="button" data-punish style="margin-top:0">${config.settleRule === 'explain' ? '追加随机惩罚' : '查看惩罚'}</button>
          </div>
        ` : !loading && !error ? `
          <section class="choice-turn-card">
            <span>第 ${turn + 1} / ${players.length} 位</span>
            <h2>轮到 ${escapeHtml(current.name)}</h2>
            <p>选择后会自动进入下一位。</p>
            <div class="choice-buttons">
              <button type="button" data-choice="A"><b>A</b><span>${escapeHtml(prompt.optionA)}</span></button>
              <button type="button" data-choice="B"><b>B</b><span>${escapeHtml(prompt.optionB)}</span></button>
            </div>
            <button class="inline-text-button" type="button" data-undo-choice ${choices.length ? '' : 'disabled'}>撤回上一位选择</button>
          </section>
          <div class="choice-progress" aria-label="选择进度">
            ${players.map((player,index) => `<span class="${index < choices.length ? 'done' : index === turn ? 'current' : ''}" title="${escapeHtml(player.name)}"></span>`).join('')}
          </div>
        ` : ''}
      </section>
    `;
  };

  const loadPrompt = async () => {
    loading = true;
    error = '';
    prompt = null;
    turn = 0;
    choices = [];
    result = null;
    render();
    try {
      const item = await context.content.draw({ gameId:'would-rather', level:config.intensity });
      if (destroyed) return;
      prompt = item;
      loading = false;
      announce(`二选一：A，${item.optionA}；B，${item.optionB}`);
    } catch (loadError) {
      console.error(loadError);
      if (destroyed) return;
      loading = false;
      error = '题目加载失败，请检查部署文件后重试。';
      context.showToast('二选一题库加载失败');
    }
    render();
  };

  const settle = () => {
    const tally = counts();
    let pool = players;
    let kicker = '随机解释选择';
    let message = '请告诉大家你为什么做出这个选择。';

    if (config.settleRule !== 'explain') {
      const target = config.settleRule === 'minority'
        ? (tally.A === tally.B ? null : tally.A < tally.B ? 'A' : 'B')
        : (tally.A === tally.B ? null : tally.A > tally.B ? 'A' : 'B');
      const targetPlayers = target ? choices.filter((choice) => choice.value === target).map((choice) => choice.player) : [];
      pool = targetPlayers.length ? targetPlayers : players;
      kicker = targetPlayers.length
        ? `${target} 阵营 · ${config.settleRule === 'minority' ? '少数派' : '多数派'}随机选中`
        : target
          ? `${target} 阵营无人 · 改为全员随机`
          : '双方平票 · 全员随机选中';
      message = '本轮由你接受惩罚。';
    }

    const player = pool[secureRandomInt(pool.length)];
    if (config.settleRule !== 'explain') {
      const choice = choices.find((item) => item.player.id === player.id)?.value;
      message = `你站在 ${choice || '对应'} 阵营，本轮由你接受惩罚。`;
    }
    result = { player, kicker, message };
    context.feedback.reveal();
    context.feedback.vibrate([22,36,55]);
    announce(`${kicker}：${player.name}`);
    render();
  };

  const selectChoice = (value) => {
    if (!prompt || result || turn >= players.length) return;
    choices.push({ player:players[turn], value });
    context.feedback.ui();
    context.feedback.vibrate(8);
    if (turn >= players.length - 1) settle();
    else {
      turn += 1;
      render();
    }
  };

  const undo = () => {
    if (!choices.length || result) return;
    choices.pop();
    turn = Math.max(0, turn - 1);
    render();
  };

  const nextRound = () => {
    round += 1;
    loadPrompt();
  };

  const showPunishment = () => {
    if (!result) return;
    context.punishment.present({ loser:result.player, level:config.intensity, onAgain:nextRound });
  };

  const handleClick = (event) => {
    const choice = event.target.closest('[data-choice]');
    if (choice) selectChoice(choice.dataset.choice);
    if (event.target.closest('[data-undo-choice]')) undo();
    if (event.target.closest('[data-next-round]')) nextRound();
    if (event.target.closest('[data-punish]')) showPunishment();
  };

  container.addEventListener('click', handleClick);
  loadPrompt();

  return () => {
    destroyed = true;
    container.removeEventListener('click', handleClick);
  };
}
