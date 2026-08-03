export const ICONS = {
  dice:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  wheel:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/></svg>',
  vote:'<svg viewBox="0 0 24 24"><path d="m9 11 2 2 4-5"/><path d="M5 4h14v16H5z"/></svg>',
  split:'<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/></svg>',
  timer:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 13l3-3"/></svg>',
  bomb:'<svg viewBox="0 0 24 24"><circle cx="10" cy="14" r="7"/><path d="m15 8 2-2 2 2M18 6c0-2 2-3 3-3"/></svg>',
  mask:'<svg viewBox="0 0 24 24"><path d="M4 6c5-2 11-2 16 0v7c0 5-4 8-8 8s-8-3-8-8z"/><path d="M7 11h3M14 11h3"/></svg>',
  crown:'<svg viewBox="0 0 24 24"><path d="m3 7 4 4 5-7 5 7 4-4-2 12H5z"/></svg>'
};

export function renderLobby({ container, store, games, onManagePlayers, onOpenGame }) {
  const state = store.getState();
  const activePlayers = state.players.filter((player) => player.active);
  const inactiveCount = state.players.length - activePlayers.length;
  const orderedGames = [...games].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN-u-co-pinyin'));

  const visibleAvatars = activePlayers.slice(0, 4);
  const remaining = activePlayers.length - visibleAvatars.length;

  container.innerHTML = `
    <section class="room-card">
      <div class="room-head">
        <div>
          <div class="eyebrow">当前派对房间</div>
          <h1>${escapeHtml(state.roomName)}</h1>
          <div class="room-meta">
            ${activePlayers.length} 位在场${inactiveCount ? ` · ${inactiveCount} 位暂离` : ''} ·
            ${levelLabel(state.intensity)} · ${state.soundEnabled ? '音效开启' : '静音'}
          </div>
        </div>
        <button class="text-button" type="button" data-manage-players>管理玩家 ›</button>
      </div>

      <div class="player-summary" aria-label="当前在场玩家">
        ${visibleAvatars.map((player) => `<span class="avatar" title="${escapeHtml(player.name)}">${escapeHtml(Array.from(player.name)[0] || '玩')}</span>`).join('')}
        ${remaining > 0 ? `<span class="avatar more">+${remaining}</span>` : ''}
        <span class="ready-chip">${activePlayers.length >= 2 ? '已就绪' : '人数不足'}</span>
      </div>
    </section>

    <div class="section-heading">
      <h2>选择游戏</h2>
      <span>${orderedGames.length} 种派对玩法</span>
    </div>

    <section class="game-grid">
      ${orderedGames.map((game) => `
        <article
          class="game-card"
          tabindex="0"
          role="button"
          data-game-id="${game.id}"
          data-ready="${game.implemented}"
          style="--game-color:${game.color}"
          aria-label="打开 ${escapeHtml(game.title)}"
        >
          <div class="game-icon">${ICONS[game.icon]}</div>
          <h3>${escapeHtml(game.title)}</h3>
          <p>${escapeHtml(game.description)}</p>
          <div class="card-footer">
            <span class="mini-tag">${escapeHtml(game.playersLabel)}</span>
            ${game.supportsAdult ? '<span class="mini-tag">18+</span>' : ''}
            ${game.implemented ? '' : '<span class="mini-tag status">待接入</span>'}
          </div>
        </article>
      `).join('')}
    </section>
  `;

  const clickHandler = (event) => {
    if (event.target.closest('[data-manage-players]')) {
      onManagePlayers();
      return;
    }
    const card = event.target.closest('[data-game-id]');
    if (card) onOpenGame(card.dataset.gameId);
  };

  const keyHandler = (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    const card = event.target.closest('[data-game-id]');
    if (!card) return;
    event.preventDefault();
    onOpenGame(card.dataset.gameId);
  };

  container.onclick = clickHandler;
  container.onkeydown = keyHandler;
}

function levelLabel(level) {
  return ({ 1:'轻松尺度', 2:'标准尺度', 3:'大胆尺度', 4:'成人尺度' })[level] || '标准尺度';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
