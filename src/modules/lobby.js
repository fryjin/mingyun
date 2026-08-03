import { activePlayers, getState, setRoute } from '../core/store.js';
import { escapeHtml, icon, initials } from '../core/utils.js';
import { listGames } from '../games/registry.js';
export function renderLobby(root,{openGameSheet}){
  const state=getState();const active=activePlayers();const away=state.players.length-active.length;const games=listGames();
  root.innerHTML=`
    <section class="room-card room-summary-card" aria-label="当前派对房间">
      <div class="room-top"><div><span class="eyebrow">当前派对房间</span><h1>${escapeHtml(state.roomName)}</h1></div><button class="text-button room-manage" data-players>管理玩家 <span aria-hidden="true">›</span></button></div>
      <div class="room-summary-chips"><span>${active.length} 人在场</span>${away?`<span>${away} 人暂离</span>`:''}<span>${levelLabel(state.settings.level)}</span><span>${state.settings.sound?'音效开启':'静音'}</span></div>
      <div class="room-players">${active.slice(0,5).map(player=>`<span class="avatar" title="${escapeHtml(player.name)}">${escapeHtml(initials(player.name))}</span>`).join('')}${active.length>5?`<span class="avatar more">+${active.length-5}</span>`:''}<span class="ready-chip"><i></i>已就绪</span></div>
    </section>
    <section class="lobby-section"><div class="section-title"><div><span class="eyebrow">PARTY GAMES</span><h2>选择游戏</h2></div><span>${games.length} 种玩法</span></div><div class="game-grid">${games.map((game,index)=>card(game,index)).join('')}</div></section>`;
  root.querySelector('[data-players]').onclick=()=>setRoute('players');
  root.querySelectorAll('[data-game]').forEach(node=>node.onclick=()=>openGameSheet(node.dataset.game));
}
function card(game,index){return `<button class="game-card" data-game="${game.id}" style="--accent:${game.color}" aria-label="${escapeHtml(game.title)}，${game.minPlayers}到${game.maxPlayers}人"><span class="game-glow"></span><span class="game-card-top"><span class="game-icon">${icon(game.icon)}</span><span class="game-index">${String(index+1).padStart(2,'0')}</span></span><strong>${escapeHtml(game.title)}</strong><p>${escapeHtml(game.shortDescription)}</p><span class="game-card-footer"><span class="game-meta">${game.minPlayers}–${game.maxPlayers} 人</span>${game.supportsAdult?'<span class="advanced-chip">成人进阶</span>':''}</span></button>`}
function levelLabel(level){return ({light:'轻松',standard:'标准',bold:'大胆',adult:'成人', 'adult-plus':'成人进阶'})[level]||'标准'}
