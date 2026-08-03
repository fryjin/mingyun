import { activePlayers, getState, session, startGame } from '../core/store.js';
import { escapeHtml, icon } from '../core/utils.js';
import { getGame } from '../games/registry.js';
import { closeOverlay, confirmDialog, showSheet, toast } from './overlay.js';
const labels={light:'轻松',standard:'标准',bold:'大胆',adult:'成人', 'adult-plus':'成人进阶'};
const adultPlusGames=new Set(['dice','wheel','king']);
export function openGameSheet(gameId) {
  const game=getGame(gameId); if(!game) return;
  const state=getState(); const settings={...game.defaultSettings,...(state.gameSettings[game.id]||{})};
  showSheet(`<header class="sheet-header"><span class="game-icon large" style="--accent:${game.color}">${icon(game.icon)}</span><div><h2>${escapeHtml(game.title)}</h2><p>${game.minPlayers}–${game.maxPlayers} 人 · ${escapeHtml(game.estimatedTime)}${adultPlusGames.has(game.id)?' · 支持成人进阶':game.supportsAdult?' · 支持成人档':''}</p></div></header>
    <p class="sheet-copy">${escapeHtml(game.description)}</p>
    <section class="rule-card"><h3>本场规则</h3><div><span>当前玩家</span><strong>${activePlayers().length} 人 · 已配置</strong></div><div><span>手机使用方式</span><strong>${escapeHtml(game.phoneMode)}</strong></div><div><span>主要结果</span><strong>${escapeHtml(game.resultMode)}</strong></div></section>
    <h3 class="settings-heading">游戏设置</h3><form id="gameSetup">${game.renderSetup?.(settings)||''}${renderLevel(game,settings.level||state.settings.level)}${renderAdultPlus(settings)}</form>
    <button class="button primary full" data-start>开始 ${escapeHtml(game.title)}</button>`,{onMount(sheet){
      game.bindSetup?.(sheet,settings);
      sheet.querySelectorAll('[data-segment]').forEach(button=>button.addEventListener('click',()=>{button.parentElement.querySelectorAll('[data-segment]').forEach(x=>x.classList.remove('active'));button.classList.add('active')}));
      const syncAdultPlus=()=>{
        const selected=sheet.querySelector('[data-level] .active')?.dataset.value;
        const panel=sheet.querySelector('[data-adult-plus-panel]');
        if(panel) panel.hidden=selected!=='adult-plus';
      };
      sheet.querySelectorAll('[data-level] [data-segment]').forEach(button=>button.addEventListener('click',syncAdultPlus));
      const contact=sheet.querySelector('[data-ap-contact]');
      const contactLevel=sheet.querySelector('[data-ap-contact-level]');
      const syncContact=()=>{if(contactLevel){contactLevel.classList.toggle('disabled',!contact?.checked);contactLevel.querySelectorAll('button').forEach(button=>button.disabled=!contact?.checked)}};
      contact?.addEventListener('change',syncContact); syncContact(); syncAdultPlus();
      sheet.querySelector('[data-start]').onclick=async()=>{
        const players=activePlayers();
        if(players.length<game.minPlayers){toast(`至少需要 ${game.minPlayers} 位在场玩家`);return}
        const next={...settings,...readCommon(sheet),...(game.readSetup?.(sheet)||{})};
        if(next.level==='adult'&&!session.adultAccepted){
          const accepted=await confirmDialog({title:'开启成人内容？',message:'仅适用于所有参与者均已满 18 岁并明确自愿的聚会。任何人都可以随时跳过或退出。',confirmText:'确认并开启'});
          if(!accepted)return; session.adultAccepted=true;
        }
        if(next.level==='adult-plus'&&!session.adultPlusAccepted){
          const alcoholText=next.adultPlus?.alcohol?'并已达到当地法定饮酒年龄；酒水任务始终允许使用无酒精饮品替代。':'；当前未开启酒水任务。';
          const accepted=await confirmDialog({title:'开启成人进阶？',message:`本档包含更直接的亲密话题与可选身体接触。请确认所有参与者均已成年、明确自愿${alcoholText}任何人可以无条件拒绝、改用替代方案或换题。`,confirmText:'所有人确认并开启'});
          if(!accepted)return; session.adultAccepted=true; session.adultPlusAccepted=true;
        }
        closeOverlay();startGame(game.id,next);
      };
    }});
}
function renderLevel(game,current){
  const options=game.levelOptions||['light','standard','bold',...(game.supportsAdult?['adult']:[]),...(adultPlusGames.has(game.id)?['adult-plus']:[])];
  return `<div class="setting-block"><div class="setting-label"><span>${game.id==='undercover'?'词库难度':'内容尺度'}</span><small>本场使用</small></div><div class="segmented level-options" data-level>${options.map(level=>`<button type="button" data-segment data-value="${level}" class="${level===current?'active':''}">${labels[level]}</button>`).join('')}</div></div>`;
}
function renderAdultPlus(settings){
  const prefs={contact:true,contactLevel:1,kissing:false,alcohol:false,...(settings.adultPlus||{})};
  return `<section class="adult-plus-panel" data-adult-plus-panel hidden><div class="adult-plus-title"><strong>成人进阶边界</strong><small>只抽取符合本场设置的内容</small></div>
    <label class="adult-plus-toggle"><span><strong>允许身体接触</strong><small>相关玩家仍需逐题确认</small></span><input type="checkbox" data-ap-contact ${prefs.contact?'checked':''}></label>
    <div class="setting-block compact"><div class="setting-label"><span>接触程度</span><small>不含亲吻</small></div><div class="segmented" data-ap-contact-level>${[1,2].map(level=>`<button type="button" data-segment data-value="${level}" class="${Number(prefs.contactLevel)===level?'active':''}">${level===1?'轻接触':'亲密互动'}</button>`).join('')}</div></div>
    <label class="adult-plus-toggle"><span><strong>允许亲吻互动</strong><small>仅额头、脸颊或手背，并须双方同意</small></span><input type="checkbox" data-ap-kissing ${prefs.kissing?'checked':''}></label>
    <label class="adult-plus-toggle"><span><strong>允许酒水互动</strong><small>只允许一小口；可随时改用无酒精饮品</small></span><input type="checkbox" data-ap-alcohol ${prefs.alcohol?'checked':''}></label>
    <p class="adult-plus-safety">拒绝、换题或使用替代方案不会产生额外惩罚。</p></section>`;
}
function readCommon(sheet){
  const level=sheet.querySelector('[data-level] .active')?.dataset.value||'standard';
  const contactLevel=Number(sheet.querySelector('[data-ap-contact-level] .active')?.dataset.value||1);
  return {level,adultPlus:{contact:sheet.querySelector('[data-ap-contact]')?.checked!==false,contactLevel,kissing:Boolean(sheet.querySelector('[data-ap-kissing]')?.checked),alcohol:Boolean(sheet.querySelector('[data-ap-alcohol]')?.checked)}};
}
