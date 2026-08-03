import { drawShared } from '../modules/questions.js';
import { closeOverlay, showModal, toast } from '../modules/overlay.js';
import { escapeHtml } from '../core/utils.js';
export function createGameContext({root,game,settings,players,global,goLobby,rerender}) {
  const cleanups=[];
  return {root,game,settings,players,global,goLobby,rerender,onCleanup(fn){cleanups.push(fn)},cleanup(){cleanups.splice(0).forEach(fn=>{try{fn()}catch{}})},async punishment(losers,{onDone}={}){await showPunishment(losers,settings.level,onDone)}};
}
export async function showPunishment(losers,level='standard',onDone){
  const names=Array.isArray(losers)?losers.map(p=>p.name).join('、'):losers.name;
  showModal(`<span class="eyebrow">本轮结果</span><h2>${escapeHtml(names)} 遭殃</h2><p class="modal-copy">选择本轮惩罚类型。任何题目都可以直接跳过或更换。</p><div class="choice-actions"><button class="choice-card" data-type="truth"><strong>真心话</strong><span>诚实回答一个问题</span></button><button class="choice-card" data-type="dare"><strong>大冒险</strong><span>完成一个安全挑战</span></button></div><button class="button ghost full" data-finish>跳过惩罚</button>`,{dismissible:false,onMount(card){
    card.querySelector('[data-finish]').onclick=()=>{closeOverlay();onDone?.()};
    card.querySelectorAll('[data-type]').forEach(button=>button.onclick=()=>load(button.dataset.type));
    async function load(type){
      card.innerHTML='<div class="loading-state">正在抽取题目…</div>';
      try{const item=await drawShared(level,type);card.innerHTML=`<span class="eyebrow">${type==='truth'?'真心话':'大冒险'}</span><h2>${escapeHtml(names)}</h2><p class="question-text">${escapeHtml(item.text)}</p>${item.consentRequired?'<p class="consent-note">涉及其他玩家时，必须先取得对方明确同意。</p>':''}<div class="modal-actions"><button class="button secondary" data-change>换一题</button><button class="button primary" data-done>完成</button></div>`;card.querySelector('[data-change]').onclick=()=>load(type);card.querySelector('[data-done]').onclick=()=>{closeOverlay();onDone?.()};}
      catch(error){toast(error.message);closeOverlay();onDone?.()}
    }
  }});
}
export function stageHeader(title,subtitle=''){return `<header class="stage-header"><div><span class="eyebrow">NOW PLAYING</span><h1>${escapeHtml(title)}</h1>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div><button class="icon-button" data-exit aria-label="结束游戏">×</button></header>`}
export function bindExit(root,ctx){root.querySelector('[data-exit]')?.addEventListener('click',ctx.goLobby)}
export function passScreen(player,actionText='查看我的内容'){return `<section class="private-stage"><span class="privacy-icon">◉</span><span class="eyebrow">请把手机交给</span><h2>${escapeHtml(player.name)}</h2><p>确认周围的人看不到屏幕后继续。</p><button class="button primary full" data-private-open>${escapeHtml(actionText)}</button></section>`}
