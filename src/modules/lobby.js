import { activePlayers, getState, setRoute } from '../core/store.js';
import { escapeHtml, icon, initials } from '../core/utils.js';
import { listGames } from '../games/registry.js';
export function renderLobby(root,{openGameSheet,openSettings}) {
  const state=getState(); const active=activePlayers(); const away=state.players.length-active.length;
  root.innerHTML=`
    <section class="room-card">
      <div class="room-top"><div><span class="eyebrow">当前派对房间</span><h1>${escapeHtml(state.roomName)}</h1><p>${active.length} 人参与${away?` · ${away} 人暂离`:''} · ${levelLabel(state.settings.level)} · ${state.settings.sound?'音效开启':'静音'}</p></div><button class="text-button" data-players>管理玩家 ›</button></div>
      <div class="room-players">${active.slice(0,5).map(player=>`<span class="avatar" title="${escapeHtml(player.name)}">${escapeHtml(initials(player.name))}</span>`).join('')}${active.length>5?`<span class="avatar more">+${active.length-5}</span>`:''}<span class="ready-chip">已就绪</span></div>
    </section>
    <section class="lobby-section"><div class="section-title"><div><span class="eyebrow">PARTY GAMES</span><h2>选择游戏</h2></div><span>${listGames().length} 种派对玩法</span></div><div class="game-grid">${listGames().map(game=>card(game)).join('')}</div></section>`;
  root.querySelector('[data-players]').onclick=()=>setRoute('players');
  root.querySelectorAll('[data-game]').forEach(node=>node.onclick=()=>openGameSheet(node.dataset.game));
}
function card(game){return `<button class="game-card" data-game="${game.id}" style="--accent:${game.color}"><span class="game-glow"></span><span class="game-icon">${icon(game.icon)}</span><strong>${escapeHtml(game.title)}</strong><p>${escapeHtml(game.shortDescription)}</p><span class="game-meta">${game.minPlayers}–${game.maxPlayers} 人</span></button>`}
function levelLabel(level){return ({light:'轻松尺度',standard:'标准尺度',bold:'大胆尺度',adult:'成人尺度'})[level]||'标准尺度'}
