import { activePlayers, getState, setRoute, subscribe } from '../core/store.js';
import { createGameContext } from './game-context.js';
import { getGame } from '../games/registry.js';
import { renderLobby } from '../modules/lobby.js';
import { renderPlayers } from '../modules/players.js';
import { openGameSheet } from '../modules/game-sheet.js';
import { openSettings } from '../modules/settings.js';
import { confirmDialog, closeOverlay, toast } from '../modules/overlay.js';
import { GameRuntime } from '../engine/game-runtime.js';

export class Application {
  constructor({ view, backButton, brandButton, settingsButton }) {
    if (!view || !backButton || !brandButton || !settingsButton) {
      throw new Error('应用外壳节点不完整');
    }
    this.view = view;
    this.backButton = backButton;
    this.brandButton = brandButton;
    this.settingsButton = settingsButton;
    this.unsubscribe = null;
    this.runtime = new GameRuntime({
      contextFactory: createGameContext,
      onError: (error, game) => this.renderGameError(error, game)
    });
    this.goLobby = this.goLobby.bind(this);
    this.render = this.render.bind(this);
  }

  start() {
    this.backButton.onclick = this.goLobby;
    this.brandButton.onclick = () => {
      if (getState().route.name !== 'lobby') this.goLobby();
    };
    this.settingsButton.onclick = openSettings;
    this.unsubscribe = subscribe(this.render);
    this.render();
  }

  destroy() {
    this.runtime.unmount();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async goLobby() {
    const state = getState();
    if (state.route.name === 'game') {
      const accepted = await confirmDialog({
        title: '结束当前游戏？',
        message: '本轮尚未完成的临时状态会被清除。',
        confirmText: '结束游戏',
        danger: true
      });
      if (!accepted) return;
    }
    this.runtime.unmount();
    closeOverlay();
    setRoute('lobby');
  }

  render() {
    const state = getState();
    const route = state.route;
    this.backButton.hidden = route.name === 'lobby';
    this.settingsButton.hidden = route.name === 'game';
    this.brandButton.classList.toggle('compact', route.name !== 'lobby');

    if (route.name === 'lobby') {
      this.runtime.unmount();
      renderLobby(this.view, { openGameSheet, openSettings });
      return;
    }

    if (route.name === 'players') {
      this.runtime.unmount();
      renderPlayers(this.view);
      return;
    }

    if (route.name !== 'game') {
      setRoute('lobby');
      return;
    }

    const game = getGame(route.gameId);
    if (!game) {
      toast('游戏不存在或尚未加载');
      setRoute('lobby');
      return;
    }

    const players = activePlayers();
    if (players.length < game.minPlayers) {
      toast(`至少需要 ${game.minPlayers} 位在场玩家`);
      setRoute('lobby');
      return;
    }

    const settings = {
      ...game.defaultSettings,
      ...(state.gameSettings[game.id] || {})
    };

    this.runtime.mount({
      root: this.view,
      game,
      settings,
      players,
      global: state.settings,
      goLobby: this.goLobby,
      rerender: this.render
    });
  }

  renderGameError(error, game) {
    console.error(`Game failed: ${game?.id || 'unknown'}`, error);
    this.view.innerHTML = `<section class="game-stage centered"><span class="eyebrow">游戏暂时无法继续</span><h2>${game?.title || '当前游戏'} 出现异常</h2><p>本轮临时状态已清理，请返回大厅重新开始。</p><button class="button primary full" data-runtime-back>返回大厅</button></section>`;
    this.view.querySelector('[data-runtime-back]')?.addEventListener('click', this.goLobby);
  }
}
