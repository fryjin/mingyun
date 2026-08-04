import { registerGame } from './registry.js';
import { adultPlusFilterKey, allowedByAdultPlus, drawGame } from '../modules/questions.js';
import { escapeHtml, randomInt, wait } from '../core/utils.js';
import { prefersReducedMotion } from '../core/motion.js';
import { bindExit, stageHeader } from './shared.js';

const plugin={
  id:'i-did-it',title:'我居然做过',sortOrder:6.5,icon:'did',color:'#d28f72',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'5–15 分钟',shortDescription:'少见经历筛选，最后一人免罚。',
  description:'没做过题目经历的人点击自己的名字并放下一根手指，做过的人保留。最后留下的一位玩家免罚，其余玩家逐人接受惩罚。',
  phoneMode:'全员共看，没做过的人点击',resultMode:'最后一人免罚，其余全部受罚',defaultSettings:{fingers:5,level:'standard'},
  renderSetup(settings){return `<div class="setting-block"><div class="setting-label"><span>初始手指数</span><small>决定本局长度</small></div><div class="segmented" data-fingers><button type="button" data-segment data-value="5" class="${Number(settings.fingers)!==10?'active':''}">5 指快局</button><button type="button" data-segment data-value="10" class="${Number(settings.fingers)===10?'active':''}">10 指完整局</button></div></div>`},
  readSetup(sheet){return {fingers:Number(sheet.querySelector('[data-fingers] .active')?.dataset.value||5)}},
  async mount(root,ctx){
    const initialFingers=Number(ctx.settings.fingers)===10?10:5;
    let fingers=new Map(ctx.players.map(player=>[player.id,initialFingers]));
    let eliminated=new Set();
    let selected=new Set();
    let question=null;
    let questionNumber=0;
    let loading=false;

    const survivors=()=>ctx.players.filter(player=>!eliminated.has(player.id));
    const fingersMarks=(count,pending=false)=>Array.from({length:initialFingers},(_,index)=>{
      const active=index<count;
      const isPending=pending&&index===count-1;
      return `<i class="${active?'on':''}${isPending?' pending':''}"></i>`;
    }).join('');

    const drawQuestion=async()=>{
      if(loading)return;
      loading=true;
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><div class="loading-state">正在抽取少见经历…</div></section>`;
      bindExit(root,ctx);
      try{
        const prefs=ctx.settings.adultPlus||{};
        const predicate=ctx.settings.level==='adult-plus'?item=>allowedByAdultPlus(item,prefs):()=>true;
        const key=ctx.settings.level==='adult-plus'?adultPlusFilterKey(prefs):'all';
        question=await drawGame(plugin.id,ctx.settings.level,predicate,key);
        questionNumber++;
        selected=new Set();
        renderQuestion();
      }catch(error){
        root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><h2>题库加载失败</h2><p>${escapeHtml(error.message)}</p><button class="button secondary full" data-back>返回大厅</button></section>`;
        bindExit(root,ctx);root.querySelector('[data-back]').onclick=ctx.goLobby;
      }finally{loading=false}
    };

    const renderQuestion=()=>{
      const alive=survivors();
      const confirmLabel=selected.size?`确认：${selected.size} 人放下一指`:'确认：所有人都做过';
      root.innerHTML=`${stageHeader(plugin.title,`${initialFingers} 指局 · 第 ${questionNumber} 题`)}
        <section class="game-stage idi-stage">
          <div class="idi-question-card"><span>我居然做过——</span><h2>${escapeHtml(question.text)}</h2><small>${question.rarity==='very-rare'?'极少见经历':question.rarity==='rare'?'少见经历':'不常见经历'}</small></div>
          <p class="idi-help">没做过的人点击自己的名字，确认后放下一根手指；做过的人不用操作。</p>
          <div class="idi-player-grid">${alive.map(player=>{
            const pending=selected.has(player.id);
            return `<button type="button" class="idi-player" data-player="${player.id}" aria-pressed="${pending}"><span class="idi-player-name">${escapeHtml(player.name)}</span><span class="idi-fingers">${fingersMarks(fingers.get(player.id),pending)}</span><b>${pending?'没做过 · 放下一指':'我做过 · 保留'}</b></button>`;
          }).join('')}</div>
          ${eliminated.size?`<section class="idi-eliminated"><strong>已淘汰</strong><div>${ctx.players.filter(player=>eliminated.has(player.id)).map(player=>`<span>${escapeHtml(player.name)}</span>`).join('')}</div></section>`:''}
          <div class="dual-actions"><button class="button secondary full" data-change>换一题</button><button class="button primary full" data-confirm>${confirmLabel}</button></div>
        </section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-player]').forEach(button=>button.onclick=()=>{
        const id=button.dataset.player;
        selected.has(id)?selected.delete(id):selected.add(id);
        renderQuestion();
      });
      root.querySelector('[data-change]').onclick=drawQuestion;
      root.querySelector('[data-confirm]').onclick=confirmQuestion;
    };

    const confirmQuestion=async()=>{
      const before=survivors();
      root.querySelectorAll('button').forEach(button=>button.disabled=true);
      before.filter(player=>selected.has(player.id)).forEach(player=>root.querySelector(`[data-player="${player.id}"]`)?.classList.add('losing-finger'));
      await wait(prefersReducedMotion()?40:360);
      const didNot=before.filter(player=>selected.has(player.id));
      const did=before.filter(player=>!selected.has(player.id));
      const newlyEliminated=[];
      didNot.forEach(player=>{
        const next=Math.max(0,(fingers.get(player.id)||0)-1);
        fingers.set(player.id,next);
        if(next===0){eliminated.add(player.id);newlyEliminated.push(player)}
      });
      const after=survivors();
      if(after.length===1){renderFinish(after[0]);return}
      if(after.length===0){
        const winner=before[randomInt(0,before.length-1)];
        renderFinish(winner,true);return;
      }
      root.innerHTML=`${stageHeader(plugin.title,`第 ${questionNumber} 题结果`)}<section class="game-stage centered idi-result"><span class="eyebrow">本题经历</span><h2>${escapeHtml(question.text)}</h2><div class="idi-result-row"><span>没做过，放下一指</span><strong>${didNot.length?didNot.map(player=>escapeHtml(player.name)).join('、'):'无人'}</strong></div><div class="idi-result-row"><span>做过并保留</span><strong>${did.length?did.map(player=>escapeHtml(player.name)).join('、'):'无人'}</strong></div>${newlyEliminated.length?`<p class="result-callout">本题淘汰：${newlyEliminated.map(player=>escapeHtml(player.name)).join('、')}</p>`:''}<button class="button primary full" data-next>下一题</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-next]').onclick=drawQuestion;
    };

    const renderFinish=(winner,randomImmune=false)=>{
      const losers=ctx.players.filter(player=>player.id!==winner.id);
      root.innerHTML=`${stageHeader(plugin.title,'本局结束')}<section class="game-stage centered idi-finish"><span class="eyebrow">唯一免罚</span><div class="idi-winner-mark">✦</div><h2>${escapeHtml(winner.name)}</h2><p>${randomImmune?'剩余玩家同时归零，系统随机选出唯一免罚者。':'坚持到最后，获得本局唯一免罚。'}</p><div class="idi-punish-list"><strong>需要逐人接受惩罚</strong><div>${losers.map(player=>`<span>${escapeHtml(player.name)}</span>`).join('')}</div></div><button class="button primary full" data-punish-all>开始逐人惩罚</button><button class="button secondary full" data-restart>再来一局</button></section>`;
      bindExit(root,ctx);
      root.querySelector('[data-punish-all]').onclick=()=>punishSequentially(losers,0);
      root.querySelector('[data-restart]').onclick=reset;
    };

    const punishSequentially=(losers,index)=>{
      if(index>=losers.length){
        root.innerHTML=`${stageHeader(plugin.title,'惩罚完成')}<section class="game-stage centered"><span class="eyebrow">本局完成</span><h2>所有惩罚已处理</h2><button class="button primary full" data-restart>再来一局</button><button class="button secondary full" data-lobby>返回大厅</button></section>`;
        bindExit(root,ctx);root.querySelector('[data-restart]').onclick=reset;root.querySelector('[data-lobby]').onclick=ctx.goLobby;return;
      }
      ctx.punishment([losers[index]],{onDone:()=>punishSequentially(losers,index+1)});
    };

    const reset=()=>{
      fingers=new Map(ctx.players.map(player=>[player.id,initialFingers]));
      eliminated=new Set();selected=new Set();question=null;questionNumber=0;drawQuestion();
    };

    drawQuestion();
  }
};
registerGame(plugin);
export default plugin;
