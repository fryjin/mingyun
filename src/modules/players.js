const STORAGE_KEY = 'mingyun.party-session.v9.1';

const DEFAULT_NAMES = ['薯宝','小林','阿杰','Miya','小北','七七','小周','阿宁','星野','阿树','栗子','可可'];
const RANDOM_NAMES = ['雪糕','阿蓝','柚子','丸子','Nova','豆包','鹿鸣','Kiki','山茶','海盐','阿满','十九','晚风','椰子','桃桃','星野','团子','小北','阿树','可可','布丁','栗子','七七'];

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function limitText(value, maxLength) {
  const chars = Array.from(String(value || '').trim());
  return chars.slice(0, maxLength).join('');
}

function limitName(value) {
  return limitText(value, 4);
}

function makePlayer(index, seed = {}) {
  return {
    id: seed.id || `player-${index + 1}`,
    name: limitName(seed.name) || DEFAULT_NAMES[index] || `玩家${index + 1}`,
    active: seed.active !== false
  };
}

function createInitialState() {
  const saved = safeParse(localStorage.getItem(STORAGE_KEY), {});
  const rawPlayers = Array.isArray(saved.players) ? saved.players.slice(0, 12) : [];
  const count = Math.min(12, Math.max(2, Number(saved.playerCount) || rawPlayers.length || 6));
  const players = Array.from({ length: count }, (_, index) => makePlayer(index, rawPlayers[index]));

  return {
    roomName: limitText(saved.roomName, 12) || '周末放松局',
    intensity: [1,2,3,4].includes(Number(saved.intensity)) ? Number(saved.intensity) : 2,
    soundEnabled: saved.soundEnabled !== false,
    hapticsEnabled: saved.hapticsEnabled !== false,
    players
  };
}

export function createPlayerStore() {
  let state = createInitialState();
  const listeners = new Set();

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        playerCount: state.players.length
      }));
    } catch {
      // The app remains usable when storage is unavailable.
    }
  };

  const notify = () => {
    persist();
    listeners.forEach((listener) => listener(getState()));
  };

  const getState = () => ({
    ...state,
    players: state.players.map((player) => ({ ...player }))
  });

  const activePlayers = () => state.players.filter((player) => player.active);

  return {
    getState,
    activePlayers,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setPlayerCount(nextCount) {
      const count = Math.min(12, Math.max(2, Number(nextCount) || 2));
      const next = Array.from({ length: count }, (_, index) => makePlayer(index, state.players[index]));
      state = { ...state, players: next };
      notify();
    },
    updatePlayerName(id, value) {
      state = {
        ...state,
        players: state.players.map((player, index) => player.id === id
          ? { ...player, name: limitName(value) || `玩家${index + 1}` }
          : player)
      };
      notify();
    },
    togglePlayerActive(id) {
      const target = state.players.find((player) => player.id === id);
      if (!target) return { ok: false, reason: '找不到该玩家' };
      if (target.active && activePlayers().length <= 2) {
        return { ok: false, reason: '至少需要保留 2 位在场玩家' };
      }
      state = {
        ...state,
        players: state.players.map((player) => player.id === id ? { ...player, active: !player.active } : player)
      };
      notify();
      return { ok: true };
    },
    randomizeNames() {
      const pool = [...RANDOM_NAMES];
      for (let index = pool.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [pool[index], pool[target]] = [pool[target], pool[index]];
      }
      state = {
        ...state,
        players: state.players.map((player, index) => ({ ...player, name: limitName(pool[index]) || `玩家${index + 1}` }))
      };
      notify();
    },
    setIntensity(level) {
      const intensity = Math.min(4, Math.max(1, Number(level) || 2));
      state = { ...state, intensity };
      notify();
    },
    setSoundEnabled(enabled) {
      state = { ...state, soundEnabled: Boolean(enabled) };
      notify();
    },
    setHapticsEnabled(enabled) {
      state = { ...state, hapticsEnabled: Boolean(enabled) };
      notify();
    }
  };
}

export function openPlayerManager({ root, store, onClose, showToast }) {
  const page = document.createElement('section');
  page.className = 'full-page show';
  page.setAttribute('aria-label', '玩家管理');

  const render = () => {
    const state = store.getState();
    const activeCount = state.players.filter((player) => player.active).length;

    page.innerHTML = `
      <header class="page-header">
        <button class="icon-button" type="button" data-close aria-label="返回">
          <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1>玩家管理</h1>
          <p>${activeCount} 位在场 · ${state.players.length - activeCount} 位暂离</p>
        </div>
      </header>

      <section class="count-panel">
        <div class="count-head">
          <strong>参与人数</strong>
          <span>支持 2–12 人，含单数</span>
        </div>
        <div class="count-grid">
          ${Array.from({ length: 11 }, (_, index) => index + 2).map((count) => `
            <button type="button" data-count="${count}" class="${count === state.players.length ? 'active' : ''}">${count}</button>
          `).join('')}
        </div>
      </section>

      <div class="section-heading">
        <h2>玩家名称</h2>
        <span>最多 4 个字符</span>
      </div>

      <section class="player-list">
        ${state.players.map((player, index) => `
          <div class="player-row ${player.active ? '' : 'inactive'}">
            <span class="avatar ${player.active ? '' : 'inactive'}">${escapeHtml(Array.from(player.name)[0] || String(index + 1))}</span>
            <input
              type="text"
              value="${escapeHtml(player.name)}"
              maxlength="4"
              inputmode="text"
              aria-label="玩家 ${index + 1} 名称"
              data-player-name="${player.id}"
            >
            <button
              type="button"
              class="leave-button ${player.active ? '' : 'restore'}"
              data-toggle-active="${player.id}"
            >${player.active ? '暂时离场' : '恢复加入'}</button>
          </div>
        `).join('')}
      </section>

      <div class="page-actions">
        <button class="secondary-button" type="button" data-random-names>随机昵称</button>
        <button class="primary-button" type="button" data-save style="margin-top:0">保存并返回</button>
      </div>
      <p class="page-note">暂时离场不会删除玩家；恢复后仍保留原名称。所有游戏只读取当前在场玩家。</p>
    `;
  };

  const handleClick = (event) => {
    const countButton = event.target.closest('[data-count]');
    if (countButton) {
      store.setPlayerCount(Number(countButton.dataset.count));
      render();
      return;
    }

    const activeButton = event.target.closest('[data-toggle-active]');
    if (activeButton) {
      const result = store.togglePlayerActive(activeButton.dataset.toggleActive);
      if (!result.ok) showToast(result.reason);
      render();
      return;
    }

    if (event.target.closest('[data-random-names]')) {
      store.randomizeNames();
      render();
      showToast('已生成随机昵称');
      return;
    }

    if (event.target.closest('[data-close]') || event.target.closest('[data-save]')) {
      close();
    }
  };

  const handleInput = (event) => {
    const input = event.target.closest('[data-player-name]');
    if (!input) return;
    const limited = Array.from(input.value).slice(0, 4).join('');
    if (input.value !== limited) input.value = limited;
    store.updatePlayerName(input.dataset.playerName, limited);
  };

  const close = () => {
    page.classList.remove('show');
    window.setTimeout(() => page.remove(), 220);
    onClose?.();
  };

  page.addEventListener('click', handleClick);
  page.addEventListener('input', handleInput);
  root.appendChild(page);
  render();

  return close;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
