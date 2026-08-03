import { adultPlusFilterKey, allowedByAdultPlus, drawShared } from '../modules/questions.js';
import { closeOverlay, showModal, toast } from '../modules/overlay.js';
import { escapeHtml } from '../core/utils.js';
export function createGameContext({root,game,settings,players,global,goLobby,rerender}) {
  const cleanups=[];
  return {root,game,settings,players,global,goLobby,rerender,onCleanup(fn){cleanups.push(fn)},cleanup(){cleanups.splice(0).forEach(fn=>{try{fn()}catch{}})},async punishment(losers,{onDone}={}){await showPunishment(losers,settings,onDone)}};
}
function requirementTags(item){
  const r=item?.requirements||{}; const tags=[];
  if(r.kissing) tags.push('亲吻互动');
  else if(r.contact) tags.push(Number(r.contactLevel||1)>=2?'亲密接触':'轻接触');
  if(r.alcohol) tags.push('酒水可选');
  if(r.pairConsent) tags.push('逐题同意');
  return tags;
}
function requirementsHtml(item){const tags=requirementTags(item);return tags.length?`<div class="requirement-tags">${tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div>`:''}
export async function showPunishment(losers,settingsOrLevel='standard',onDone){
  const settings=typeof settingsOrLevel==='string'?{level:settingsOrLevel}:settingsOrLevel||{level:'standard'};
  const level=settings.level||'standard'; const prefs=settings.adultPlus||{};
  const names=Array.isArray(losers)?losers.map(p=>p.name).join('、'):losers.name;
  showModal(`<span class="eyebrow">Midnight Penalty</span><h2>${escapeHtml(names)} 遭殃</h2><p class="modal-copy">选择本轮惩罚类型。任何题目都可以直接跳过、更换或使用替代方案。</p><div class="choice-actions"><button class="choice-card" data-type="truth"><strong>真心话</strong><span>诚实回答一个问题</span></button><button class="choice-card" data-type="dare"><strong>大冒险</strong><span>完成一个自愿挑战</span></button></div><button class="button ghost full" data-finish>跳过惩罚</button>`,{dismissible:false,onMount(card){
    card.querySelector('[data-finish]').onclick=()=>{closeOverlay();onDone?.()};
    card.querySelectorAll('[data-type]').forEach(button=>button.onclick=()=>load(button.dataset.type));
    async function load(type){
      card.innerHTML='<div class="loading-state">正在抽取题目…</div>';
      try{
        const predicate=level==='adult-plus'?item=>allowedByAdultPlus(item,prefs):()=>true;
        const key=level==='adult-plus'?adultPlusFilterKey(prefs):'all';
        const item=await drawShared(level,type,predicate,key); renderItem(item,type,false);
      } catch(error){toast(error.message);closeOverlay();onDone?.()}
    }
    function renderItem(item,type,accepted=false,overrideText=''){
      const text=overrideText||item.text; const needsGate=!accepted&&item.consentRequired&&requirementTags(item).length>0;
      card.innerHTML=`<span class="eyebrow">${type==='truth'?'真心话':'大冒险'}${level==='adult-plus'?' · 成人进阶':''}</span><h2>${escapeHtml(names)}</h2>${requirementsHtml(item)}<p class="question-text">${escapeHtml(text)}</p>${needsGate?'<section class="consent-gate"><strong>逐题确认</strong><p>所有相关玩家都明确同意后再开始。任何人拒绝时，直接使用替代方案或换题，不追加惩罚。</p></section>':item.consentRequired?'<p class="consent-note">本题已确认采用自愿方式；任意玩家仍可随时停止。</p>':''}<div class="modal-actions">${needsGate?'<button class="button primary" data-agree>相关玩家都同意</button>':''}${needsGate&&item.alternatives?.length?'<button class="button secondary" data-alt>使用替代方案</button>':''}<button class="button secondary" data-change>换一题</button>${needsGate?'':'<button class="button primary" data-done>完成</button>'}</div>`;
      card.querySelector('[data-agree]')?.addEventListener('click',()=>renderItem(item,type,true));
      card.querySelector('[data-alt]')?.addEventListener('click',()=>renderItem(item,type,true,item.alternatives[0]));
      card.querySelector('[data-change]').onclick=()=>load(type);
      card.querySelector('[data-done]')?.addEventListener('click',()=>{closeOverlay();onDone?.()});
    }
  }});
}
export function stageHeader(title,subtitle=''){return `<header class="stage-header"><div><span class="eyebrow">Midnight Game Hall</span><h1>${escapeHtml(title)}</h1>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div><button class="icon-button" data-exit aria-label="结束游戏">×</button></header>`}
export function bindExit(root,ctx){root.querySelector('[data-exit]')?.addEventListener('click',ctx.goLobby)}
export function passScreen(player,actionText='查看我的内容'){return `<section class="private-stage"><span class="privacy-icon">◉</span><span class="eyebrow">秘密交接</span><h2>${escapeHtml(player.name)}</h2><p>确认周围的人看不到屏幕后继续。</p><button class="button primary full" data-private-open>${escapeHtml(actionText)}</button></section>`}
