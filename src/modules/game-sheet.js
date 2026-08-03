import { activePlayers, getState, session, startGame } from '../core/store.js';
import { escapeHtml, icon } from '../core/utils.js';
import { getGame } from '../games/registry.js';
import { closeOverlay, showSheet, toast } from './overlay.js';
const labels={light:['轻松','友好热场'],standard:['标准','适合多数聚会'],bold:['大胆','更直接的问题'],adult:['成人','亲密话题'], 'adult-plus':['成人进阶','接触与酒水可选']};
export function openGameSheet(gameId){
  const game=getGame(gameId);if(!game)return;
  const state=getState();const settings={...game.defaultSettings,...(state.gameSettings[game.id]||{})};
  showSheet(`<div class="sheet-body"><header class="sheet-header"><span class="game-icon large" style="--accent:${game.color}">${icon(game.icon)}</span><div><h2>${escapeHtml(game.title)}</h2><p>${game.minPlayers}–${game.maxPlayers} 人 · ${escapeHtml(game.estimatedTime)}${game.supportsAdult?' · 支持成人进阶':''}</p></div></header>
    <p class="sheet-copy">${escapeHtml(game.description)}</p>
    <section class="rule-card"><h3>本场概览</h3><div><span>当前玩家</span><strong>${activePlayers().length} 人 · 已配置</strong></div><div><span>手机使用</span><strong>${escapeHtml(game.phoneMode)}</strong></div><div><span>本轮结果</span><strong>${escapeHtml(game.resultMode)}</strong></div></section>
    <h3 class="settings-heading">游戏设置</h3><form id="gameSetup">${game.renderSetup?.(settings)||''}${renderLevel(game,settings.level||state.settings.level)}${renderAdultPlus(settings)}</form></div>
    <footer class="sheet-action-bar"><button class="button primary full" data-start>开始 ${escapeHtml(game.title)}</button></footer>`,{className:'game-detail-sheet',onMount(sheet){
      game.bindSetup?.(sheet,settings);
      const activate=button=>{button.parentElement.querySelectorAll('[data-segment]').forEach(node=>{node.classList.remove('active');node.setAttribute('aria-pressed','false')});button.classList.add('active');button.setAttribute('aria-pressed','true')};
      sheet.querySelectorAll('[data-segment]').forEach(button=>button.addEventListener('click',()=>activate(button)));
      const syncAdultPlus=()=>{const selected=sheet.querySelector('[data-level] .active')?.dataset.value;const panel=sheet.querySelector('[data-adult-plus-panel]');if(panel)panel.hidden=selected!=='adult-plus'};
      sheet.querySelectorAll('[data-level] [data-segment]').forEach(button=>button.addEventListener('click',syncAdultPlus));
      const contact=sheet.querySelector('[data-ap-contact]');const contactLevel=sheet.querySelector('[data-ap-contact-level]');const kissing=sheet.querySelector('[data-ap-kissing]');
      const syncContact=()=>{const enabled=Boolean(contact?.checked);if(contactLevel){contactLevel.classList.toggle('disabled',!enabled);contactLevel.querySelectorAll('button').forEach(button=>button.disabled=!enabled)}if(kissing){if(!enabled)kissing.checked=false;kissing.disabled=!enabled}};
      contact?.addEventListener('change',syncContact);syncContact();syncAdultPlus();
      sheet.querySelector('[data-start]').onclick=async()=>{
        const players=activePlayers();if(players.length<game.minPlayers){toast(`至少需要 ${game.minPlayers} 位在场玩家`);return}
        const next={...settings,...readCommon(sheet),...(game.readSetup?.(sheet)||{})};
        if(next.level==='adult'&&!session.adultAccepted){const accepted=await confirmInsideSheet(sheet,{title:'开启成人内容？',message:'仅适用于所有参与者均已满 18 岁并明确自愿的聚会。任何人都可以随时跳过或退出。',confirmText:'确认并开启'});if(!accepted)return;session.adultAccepted=true}
        if(next.level==='adult-plus'&&!session.adultPlusAccepted){const alcoholText=next.adultPlus?.alcohol?'，并确认饮酒参与者已达到当地法定饮酒年龄；酒水始终可改为无酒精饮品':'；当前未开启酒水互动';const accepted=await confirmInsideSheet(sheet,{title:'开启成人进阶？',message:`本档包含更直接的亲密话题与可选身体接触${alcoholText}。所有参与者须成年并明确自愿，任意玩家可以无条件拒绝、使用替代方案或换题。`,confirmText:'所有人确认并开启'});if(!accepted)return;session.adultAccepted=true;session.adultPlusAccepted=true}
        closeOverlay();startGame(game.id,next);
      };
    }});
}
function renderLevel(game,current){
  const base=game.levelOptions||['light','standard','bold',...(game.supportsAdult?['adult']:[])];
  const options=[...new Set([...base,...(game.supportsAdult?['adult-plus']:[])])];
  if(!options.includes(current))current='standard';
  return `<div class="setting-block"><div class="setting-label"><span>${game.id==='undercover'?'词库尺度':'内容尺度'}</span><small>每个游戏单独保存</small></div><div class="level-picker" data-level role="radiogroup">${options.map(level=>`<button type="button" class="level-card ${level==='adult-plus'?'advanced':''} ${level===current?'active':''}" data-segment data-value="${level}" aria-pressed="${level===current}"><strong>${labels[level][0]}</strong><small>${labels[level][1]}</small></button>`).join('')}</div></div>`;
}
function renderAdultPlus(settings){
  const prefs={contact:true,contactLevel:1,kissing:false,alcohol:false,...(settings.adultPlus||{})};
  return `<section class="adult-plus-panel" data-adult-plus-panel hidden><div class="adult-plus-title"><div><strong>成人进阶边界</strong><small>系统只抽取符合本场设置的内容</small></div><span>逐题仍需确认</span></div>
    <label class="adult-plus-toggle"><span><strong>允许身体接触</strong><small>包括牵手、拥抱、共舞等</small></span><input type="checkbox" data-ap-contact ${prefs.contact?'checked':''}></label>
    <div class="setting-block compact"><div class="setting-label"><span>接触程度</span><small>不含亲吻</small></div><div class="segmented" data-ap-contact-level>${[1,2].map(level=>`<button type="button" data-segment data-value="${level}" aria-pressed="${Number(prefs.contactLevel)===level}" class="${Number(prefs.contactLevel)===level?'active':''}">${level===1?'轻接触':'亲密互动'}</button>`).join('')}</div></div>
    <label class="adult-plus-toggle"><span><strong>允许亲吻互动</strong><small>仅额头、脸颊或手背</small></span><input type="checkbox" data-ap-kissing ${prefs.kissing?'checked':''}></label>
    <label class="adult-plus-toggle"><span><strong>允许酒水互动</strong><small>只允许一小口，始终可无酒精替代</small></span><input type="checkbox" data-ap-alcohol ${prefs.alcohol?'checked':''}></label>
    <p class="adult-plus-safety">拒绝、换题或使用替代方案不会产生额外惩罚。</p></section>`;
}
function readCommon(sheet){
  const level=sheet.querySelector('[data-level] .active')?.dataset.value||'standard';const contactLevel=Number(sheet.querySelector('[data-ap-contact-level] .active')?.dataset.value||1);
  return {level,adultPlus:{contact:sheet.querySelector('[data-ap-contact]')?.checked!==false,contactLevel,kissing:Boolean(sheet.querySelector('[data-ap-kissing]')?.checked),alcohol:Boolean(sheet.querySelector('[data-ap-alcohol]')?.checked)}};
}

function confirmInsideSheet(sheet,{title,message,confirmText='确认'}){
  return new Promise(resolve=>{
    sheet.querySelector('[data-sheet-confirm]')?.remove();
    const start=sheet.querySelector('[data-start]');if(start)start.disabled=true;
    const node=document.createElement('section');node.className='sheet-inline-confirm';node.dataset.sheetConfirm='';
    node.innerHTML=`<span class="eyebrow">需要确认</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p><div class="modal-actions"><button type="button" class="button secondary" data-confirm-cancel>返回设置</button><button type="button" class="button primary" data-confirm-accept>${escapeHtml(confirmText)}</button></div>`;
    const body=sheet.querySelector('.sheet-body');body.appendChild(node);node.scrollIntoView({behavior:'smooth',block:'nearest'});node.querySelector('[data-confirm-accept]').focus({preventScroll:true});
    const finish=value=>{node.remove();if(start){start.disabled=false;if(!value)start.focus({preventScroll:true})}resolve(value)};
    node.querySelector('[data-confirm-cancel]').onclick=()=>finish(false);
    node.querySelector('[data-confirm-accept]').onclick=()=>finish(true);
  });
}
