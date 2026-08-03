import { announce, escapeHtml, levelLabel, secureRandomInt } from './shared.js';

export function mountMostLikely(container, context) {
  const players = context.store.activePlayers().map((player) => ({ ...player }));
  const config = context.config;
  let round = 1;
  let prompt = null;
  let loading = true;
  let error = '';
  let votes = Object.fromEntries(players.map((player) => [player.id, 0]));
  let selectedIds = [];
  let loser = null;
  let destroyed = false;

  const render = () => {
    const totalVotes = Object.values(votes).reduce((sum, value) => sum + value, 0);
    container.innerHTML = `
      <section class="game-stage vote-game">
        <div class="game-head">
          <div><small>ROUND ${String(round).padStart(2,'0')}</small><h1>谁最可能</h1></div>
          <span class="rule-pill">${levelLabel(config.intensity)} · ${config.tieRule === 'all' ? '并列全部' : '并列随机'}</span>
        </div>

        <section class="prompt-card cyan ${loading ? 'loading' : ''}">
          <span class="prompt-label">本轮题目</span>
          <p>${loading ? '正在抽取题目…' : error ? escapeHtml(error) : escapeHtml(prompt?.text || '暂无题目')}</p>
        </section>

        ${loser ? `
          <section class="game-result-card">
            <small>得票最高</small>
            <h2>${escapeHtml(loser.name)}</h2>
            <p>${selectedIds.length > 1 ? `并列 ${selectedIds.length} 人，按本场规则结算。` : '全场目光已经锁定。'}</p>
          </section>
          <div class="game-action-grid">
            <button class="secondary-button" type="button" data-next-round>跳过惩罚，下一题</button>
            <button class="primary-button" type="button" data-punish style="margin-top:0">查看惩罚</button>
          </div>
        ` : `
          <p class="game-instruction">大家同时指向一位玩家，再由主持人登记票数。</p>
          <section class="vote-player-grid">
            ${players.map((player) => `
              <article class="vote-player-card ${selectedIds.includes(player.id) ? 'selected' : ''}">
                <span class="avatar">${escapeHtml(Array.from(player.name)[0] || '玩')}</span>
                <strong>${escapeHtml(player.name)}</strong>
                <div class="vote-counter">
                  <button type="button" data-vote-minus="${player.id}" aria-label="减少 ${escapeHtml(player.name)} 的票数">−</button>
                  <b>${votes[player.id]}</b>
                  <button type="button" data-vote-plus="${player.id}" aria-label="增加 ${escapeHtml(player.name)} 的票数">＋</button>
                </div>
              </article>
            `).join('')}
          </section>
          <div class="game-action-grid">
            <button class="secondary-button" type="button" data-reset-votes ${totalVotes === 0 ? 'disabled' : ''}>清空票数</button>
            <button class="primary-button" type="button" data-settle-votes style="margin-top:0" ${loading || error || totalVotes === 0 ? 'disabled' : ''}>完成投票 · ${totalVotes} 票</button>
          </div>
        `}
      </section>
    `;
  };

  const loadPrompt = async () => {
    loading = true;
    error = '';
    prompt = null;
    loser = null;
    selectedIds = [];
    votes = Object.fromEntries(players.map((player) => [player.id, 0]));
    render();
    try {
      const item = await context.content.draw({ gameId:'most-likely', level:config.intensity });
      if (destroyed) return;
      prompt = item;
      loading = false;
      announce(`谁最可能：${item.text}`);
    } catch (loadError) {
      console.error(loadError);
      if (destroyed) return;
      loading = false;
      error = '题目加载失败，请检查部署文件后重试。';
      context.showToast('谁最可能题库加载失败');
    }
    render();
  };

  const settle = () => {
    const maximum = Math.max(...Object.values(votes));
    if (maximum <= 0) {
      context.showToast('请先登记至少一票');
      return;
    }
    const tied = players.filter((player) => votes[player.id] === maximum);
    selectedIds = tied.map((player) => player.id);
    if (tied.length === 1) {
      loser = tied[0];
    } else if (config.tieRule === 'all') {
      loser = {
        id:`group-${round}`,
        name:tied.map((player) => player.name).join('、')
      };
    } else {
      loser = tied[secureRandomInt(tied.length)];
      selectedIds = [loser.id];
    }
    context.feedback.reveal();
    context.feedback.vibrate([22,38,58]);
    announce(`本轮得票最高：${loser.name}`);
    render();
  };

  const nextRound = () => {
    round += 1;
    loadPrompt();
  };

  const showPunishment = () => {
    if (!loser) return;
    context.punishment.present({ loser, level:config.intensity, onAgain:nextRound });
  };

  const handleClick = (event) => {
    const plus = event.target.closest('[data-vote-plus]');
    if (plus && !loser) {
      votes[plus.dataset.votePlus] = Math.min(players.length, votes[plus.dataset.votePlus] + 1);
      context.feedback.ui();
      render();
      return;
    }
    const minus = event.target.closest('[data-vote-minus]');
    if (minus && !loser) {
      votes[minus.dataset.voteMinus] = Math.max(0, votes[minus.dataset.voteMinus] - 1);
      render();
      return;
    }
    if (event.target.closest('[data-reset-votes]')) {
      votes = Object.fromEntries(players.map((player) => [player.id, 0]));
      render();
    }
    if (event.target.closest('[data-settle-votes]')) settle();
    if (event.target.closest('[data-punish]')) showPunishment();
    if (event.target.closest('[data-next-round]')) nextRound();
  };

  container.addEventListener('click', handleClick);
  loadPrompt();

  return () => {
    destroyed = true;
    container.removeEventListener('click', handleClick);
  };
}
