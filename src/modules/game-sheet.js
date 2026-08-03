import { activePlayers, getState, session, startGame } from '../core/store.js';
import { escapeHtml, icon } from '../core/utils.js';
import { getGame } from '../games/registry.js';
import { closeOverlay, confirmDialog, showSheet, toast } from './overlay.js';
const labels={light:'轻松',standard:'标准',bold:'大胆',adult:'成人'};
export function openGameSheet(gameId) {
  const game=getGame(gameId); if(!game) return;
  const state=getState(); const settings={...game.defaultSettings,...(state.gameSettings[game.id]||{})};
  showSheet(`<header class="sheet-header"><span class="game-icon large" style="--accent:${game.color}">${icon(game.icon)}</span><div><h2>${escapeHtml(game.title)}</h2><p>${game.minPlayers}–${game.maxPlayers} 人 · ${escapeHtml(game.estimatedTime)}${game.supportsAdult?' · 支持成人档':''}</p></div></header>
    <p class="sheet-copy">${escapeHtml(game.description)}</p>
    <section class="rule-card"><h3>本场规则</h3><div><span>当前玩家</span><strong>${activePlayers().length} 人 · 已配置</strong></div><div><span>手机使用方式</span><strong>${escapeHtml(game.phoneMode)}</strong></div><div><span>主要结果</span><strong>${escapeHtml(game.resultMode)}</strong></div></section>
    <h3 class="settings-heading">游戏设置</h3><form id="gameSetup">${game.renderSetup?.(settings)||''}${renderLevel(game,settings.level||state.settings.level)}</form>
    <button class="button primary full" data-start>开始 ${escapeHtml(game.title)}</button>`,{onMount(sheet){
      game.bindSetup?.(sheet,settings);
      sheet.querySelectorAll('[data-segment]').forEach(button=>button.onclick=()=>{button.parentElement.querySelectorAll('[data-segment]').forEach(x=>x.classList.remove('active'));button.classList.add('active')});
      sheet.querySelector('[data-start]').onclick=async()=>{
        const players=activePlayers();
        if(players.length<game.minPlayers){toast(`至少需要 ${game.minPlayers} 位在场玩家`);return}
        const next={...settings,...readCommon(sheet),...(game.readSetup?.(sheet)||{})};
        if(next.level==='adult'&&!session.adultAccepted){
          const accepted=await confirmDialog({title:'开启成人内容？',message:'仅适用于所有参与者均已满 18 岁并明确自愿的聚会。任何人都可以随时跳过或退出。',confirmText:'确认并开启'});
          if(!accepted)return; session.adultAccepted=true;
        }
        closeOverlay();startGame(game.id,next);
      };
    }});
}
function renderLevel(game,current){
  const options=game.levelOptions||['light','standard','bold',...(game.supportsAdult?['adult']:[])];
  return `<div class="setting-block"><div class="setting-label"><span>${game.id==='undercover'?'词库难度':'内容尺度'}</span><small>本场使用</small></div><div class="segmented" data-level>${options.map(level=>`<button type="button" data-segment data-value="${level}" class="${level===current?'active':''}">${labels[level]}</button>`).join('')}</div></div>`;
}
function readCommon(sheet){return {level:sheet.querySelector('[data-level] .active')?.dataset.value||'standard'}}
