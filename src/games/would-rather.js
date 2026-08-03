import { registerGame } from './registry.js';
import { drawGame } from '../modules/questions.js';
import { escapeHtml } from '../core/utils.js';
import { bindExit, passScreen, stageHeader } from './shared.js';

const plugin={
  id:'would-rather',title:'二选一',sortOrder:1,icon:'split',color:'#60a5fa',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'1–2 分钟',shortDescription:'逐人秘密选择，最后统一揭晓。',
  description:'每个人秘密选择 A 或 B。全部选完后统一揭晓，由少数派或多数派接受惩罚。',
  phoneMode:'逐人私密传递',resultMode:'少数派或多数派接受惩罚',
  defaultSettings:{settlement:'minority',level:'standard'},
  renderSetup(settings){
    const settlement=['minority','majority'].includes(settings.settlement)?settings.settlement:'minority';
    return `<div class="setting-block"><div class="setting-label"><span>哪一派接受惩罚</span><small>揭晓后结算</small></div><div class="segmented" data-settlement><button type="button" data-segment data-value="minority" class="${settlement==='minority'?'active':''}">少数派</button><button type="button" data-segment data-value="majority" class="${settlement==='majority'?'active':''}">多数派</button></div></div>`;
  },
  readSetup(sheet){return {settlement:sheet.querySelector('[data-settlement] .active')?.dataset.value||'minority'}},
  async mount(root,ctx){
    let item,index=0,choices=[];
    try{item=await drawGame('would-rather',ctx.settings.level)}catch(error){root.innerHTML=escapeHtml(error.message);return}
    const settlement=['minority','majority'].includes(ctx.settings.settlement)?ctx.settings.settlement:'minority';
    const intro=()=>{
      root.innerHTML=`${stageHeader(plugin.title,'秘密选择 · 统一揭晓')}<section class="game-stage centered"><span class="eyebrow">本轮情境</span><h2 class="choice-question">${escapeHtml(item.question||'遇到这种情况，你会怎么选？')}</h2><div class="choice-preview"><article><small>A</small><strong>${escapeHtml(item.optionA)}</strong></article><span>或</span><article><small>B</small><strong>${escapeHtml(item.optionB)}</strong></article></div><button class="button primary full" data-start>开始选择</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-start]').onclick=pass;
    };
    const pass=()=>{
      const player=ctx.players[index];
      root.innerHTML=`${stageHeader(plugin.title)}${passScreen(player,'进入选择')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=()=>choose(player);
    };
    const choose=player=>{
      root.innerHTML=`${stageHeader(plugin.title)}<section class="private-stage"><span class="eyebrow">${escapeHtml(player.name)} · 私密选择</span><h2 class="private-choice-question">${escapeHtml(item.question||'遇到这种情况，你会怎么选？')}</h2><div class="private-choice"><button data-value="A"><small>A</small><strong>${escapeHtml(item.optionA)}</strong></button><button data-value="B"><small>B</small><strong>${escapeHtml(item.optionB)}</strong></button></div></section>`;
      bindExit(root,ctx);root.querySelectorAll('[data-value]').forEach(button=>button.onclick=()=>save(player,button.dataset.value));
    };
    const save=(player,value)=>{choices.push({player,value});index++;index>=ctx.players.length?ready():pass()};
    const ready=()=>{
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">选择完成</span><h2>准备揭晓</h2><p>所有人的选择已经锁定。</p><button class="button primary full" data-reveal>揭晓结果</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-reveal]').onclick=reveal;
    };
    const reveal=()=>{
      const A=choices.filter(x=>x.value==='A').map(x=>x.player),B=choices.filter(x=>x.value==='B').map(x=>x.player);
      let losers=[];
      if(A.length===B.length)losers=[...ctx.players];
      else if(settlement==='minority')losers=A.length<B.length?A:B;
      else losers=A.length>B.length?A:B;
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage"><span class="eyebrow">结果揭晓</span><div class="reveal-columns"><article><small>A · ${A.length} 人</small><h3>${escapeHtml(item.optionA)}</h3><p>${escapeHtml(A.map(p=>p.name).join('、')||'无人选择')}</p></article><article><small>B · ${B.length} 人</small><h3>${escapeHtml(item.optionB)}</h3><p>${escapeHtml(B.map(p=>p.name).join('、')||'无人选择')}</p></article></div><p class="result-callout">${A.length===B.length?'人数相同，本轮全员接受惩罚':`${escapeHtml(losers.map(p=>p.name).join('、'))} 接受惩罚`}</p><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-next>下一题</button></section>`;
      bindExit(root,ctx);
      root.querySelector('[data-punish]').onclick=()=>ctx.punishment(losers,{onDone:()=>plugin.mount(root,ctx)});
      root.querySelector('[data-next]').onclick=()=>plugin.mount(root,ctx);
    };
    intro();
  }
};
registerGame(plugin);
export default plugin;
