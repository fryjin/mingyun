import { createPlayerStore, openPlayerManager } from './modules/players.js';
import { renderLobby } from './modules/lobby.js';
import {
  getGames,
  getGame,
  openGameSheet,
  createFeedback,
  createPunishmentPresenter
} from './modules/games.js';
import { QuestionLoader } from './modules/questions.js';
import { GameContentLoader } from './modules/game-content.js';

const appView = document.querySelector('#appView');
const overlayRoot = document.querySelector('#overlayRoot');
const backButton = document.querySelector('#backButton');
const settingsButton = document.querySelector('#settingsButton');
const toast = document.querySelector('#toast');

const store = createPlayerStore();
const questionLoader = new QuestionLoader();
const gameContentLoader = new GameContentLoader();
const feedback = createFeedback(store);
const punishment = createPunishmentPresenter({
  root:overlayRoot,
  loader:questionLoader,
  feedback,
  showToast
});

let currentScreen = 'lobby';
let currentGame = null;
let currentCleanup = null;
let toastTimer = 0;

function renderCurrent() {
  if (currentScreen !== 'lobby') return;
  backButton.hidden = true;
  settingsButton.hidden = false;
  currentGame = null;
  appView.className = 'app-view';
  renderLobby({
    container:appView,
    store,
    games:getGames(),
    onManagePlayers:openPlayers,
    onOpenGame:openGame
  });
}

function openPlayers() {
  openPlayerManager({
    root:overlayRoot,
    store,
    onClose:renderCurrent,
    showToast
  });
}

function openGame(gameId) {
  const game = getGame(gameId);
  if (!game) return;

  openGameSheet({
    root:overlayRoot,
    game,
    store,
    showToast,
    onStart:startGame
  });
}

function startGame(game, config) {
  const activeCount = store.activePlayers().length;
  if (activeCount < game.minPlayers) {
    showToast(`本玩法至少需要 ${game.minPlayers} 位在场玩家`);
    return;
  }
  if (!game.implemented || typeof game.mount !== 'function') {
    showToast('该玩法将在后续版本接入');
    return;
  }

  currentCleanup?.();
  punishment.close();
  currentScreen = 'game';
  currentGame = game;
  backButton.hidden = false;
  settingsButton.hidden = false;
  appView.className = 'app-view game-view';
  appView.innerHTML = '';

  currentCleanup = game.mount(appView, {
    store,
    config,
    loader:questionLoader,
    content:gameContentLoader,
    feedback,
    punishment,
    showToast
  });
  feedback.ui();
}

function returnToLobby() {
  if (currentScreen === 'lobby') return;
  currentCleanup?.();
  currentCleanup = null;
  punishment.close();
  currentScreen = 'lobby';
  renderCurrent();
  feedback.ui();
}

function openSettings() {
  const state = store.getState();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <section class="dialog" role="dialog" aria-modal="true" aria-label="全局设置">
      <h2>全局设置</h2>
      <p>以下设置会应用到全部游戏，并保存在当前设备。</p>

      <div class="toggle-row">
        <span><strong>音效</strong><small>骰子、转盘与揭晓反馈</small></span>
        <button class="switch ${state.soundEnabled ? 'on' : ''}" type="button" data-toggle-sound aria-label="切换音效"></button>
      </div>
      <div class="toggle-row">
        <span><strong>设备触感</strong><small>支持的手机上使用轻量震动</small></span>
        <button class="switch ${state.hapticsEnabled ? 'on' : ''}" type="button" data-toggle-haptics aria-label="切换设备触感"></button>
      </div>

      <div class="settings-label">默认内容尺度</div>
      <div class="segmented">
        ${[1,2,3].map((level) => `<button type="button" data-default-intensity="${level}" class="${state.intensity === level ? 'active' : ''}">${({1:'轻松',2:'标准',3:'大胆'})[level]}</button>`).join('')}
      </div>

      <button class="primary-button" type="button" data-close-settings>完成</button>
    </section>
  `;
  overlayRoot.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    window.setTimeout(() => overlay.remove(), 180);
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-close-settings]')) close();
    if (event.target.closest('[data-toggle-sound]')) {
      store.setSoundEnabled(!store.getState().soundEnabled);
      close();
      openSettings();
      showToast(store.getState().soundEnabled ? '音效已开启' : '音效已关闭');
    }
    if (event.target.closest('[data-toggle-haptics]')) {
      store.setHapticsEnabled(!store.getState().hapticsEnabled);
      close();
      openSettings();
      showToast(store.getState().hapticsEnabled ? '设备触感已开启' : '设备触感已关闭');
    }
    const intensity = event.target.closest('[data-default-intensity]');
    if (intensity) {
      store.setIntensity(Number(intensity.dataset.defaultIntensity));
      close();
      openSettings();
    }
  });
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

backButton.addEventListener('click', returnToLobby);
settingsButton.addEventListener('click', openSettings);

store.subscribe(() => {
  if (currentScreen === 'lobby') renderCurrent();
});

window.addEventListener('online', () => showToast('网络已恢复'));
window.addEventListener('offline', () => showToast('当前离线，已缓存内容仍可使用'));

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service Worker 注册失败', error);
    });
  });
}

questionLoader.loadManifest().catch((error) => {
  console.warn('共享惩罚题库清单预热失败，将在首次使用时重试。', error);
});

gameContentLoader.loadManifest().catch((error) => {
  console.warn('玩法专用题库清单预热失败，将在首次使用时重试。', error);
});

renderCurrent();
