import { registerGame } from './registry.js';
import { adultPlusFilterKey, allowedByAdultPlus, drawGame } from '../modules/questions.js';
import { escapeHtml, shuffle, pick } from '../core/utils.js';
import { bindExit, passScreen, stageHeader } from './shared.js';

const plugin={
  id:'king',title:'国王游戏',sortOrder:2,icon:'crown',color:'#f59e0b',minPlayers:3,maxPlayers:12,supportsAdult:true,
  estimatedTime:'2–5 分钟/轮',shortDescription:'每轮重新发号码，再抽国王和任务。',
  description:'每轮重新分配号码。所有人看完号码后，揭晓国王，再一次性揭晓任务和执行号码。',
  phoneMode:'逐人私密传递',resultMode:'按号码完成国王任务',defaultSettings:{level:'standard'},
  renderSetup(){return `<div class="info-strip"><strong>每轮重新洗牌</strong><span>号码、国王和任务都会重新随机</span></div>`},
  async mount(root,ctx){
    let round=0,assignment=new Map(),viewIndex=0,king=null,instruction=null,targetNumbers=[];
    const startRound=()=>{
      round++;viewIndex=0;king=null;instruction=null;targetNumbers=[];
      const numbers=shuffle(Array.from({length:ctx.players.length},(_,index)=>index+1));
      assignment=new Map(ctx.players.map((player,index)=>[player.id,numbers[index]]));
      renderRoundReady();
    };
    const renderRoundReady=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">重新洗牌</span><h2>查看本轮号码</h2><p>请按派对房间顺序传递手机，每个人只看自己的号码。</p><button class="button primary full" data-begin>开始查看</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-begin]').onclick=renderPass;
    };
    const renderPass=()=>{
      const player=ctx.players[viewIndex];
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}${passScreen(player,'查看我的号码')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=()=>renderNumber(player);
    };
    const renderNumber=player=>{
      root.innerHTML=`${stageHeader(plugin.title)}<section class="private-stage secret-card"><span class="eyebrow">${escapeHtml(player.name)}</span><p>你的号码</p><div class="secret-number">${assignment.get(player.id)}</div><button class="button primary full" data-remember>我记住了</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-remember]').onclick=()=>{viewIndex++;viewIndex>=ctx.players.length?renderNumbersComplete():renderPass()};
    };
    const renderNumbersComplete=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">号码查看完成</span><h2>准备抽国王</h2><button class="button primary full" data-king>揭晓本轮国王</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-king]').onclick=revealKing;
    };
    const revealKing=()=>{
      king=pick(ctx.players);
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered king-reveal"><span class="eyebrow">本轮国王</span><div class="crown-mark">♛</div><h2>${escapeHtml(king.name)}</h2><button class="button primary full" data-task>抽取任务与号码</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-task]').onclick=()=>revealTask();
    };
    const formatInstruction=text=>text.replace(/\{target(\d+)\}/g,(_,number)=>`${targetNumbers[Number(number)-1]}号`);
    const requirementTags=item=>{const r=item?.requirements||{},tags=[];if(r.kissing)tags.push('亲吻互动');else if(r.contact)tags.push(Number(r.contactLevel||1)>=2?'亲密接触':'轻接触');if(r.alcohol)tags.push('酒水可选');if(r.pairConsent)tags.push('逐题同意');return tags};
    const revealTask=async()=>{
      const maxTargets=Math.max(1,ctx.players.length-1); const prefs=ctx.settings.adultPlus||{};
      try{
        instruction=await drawGame('king',ctx.settings.level,item=>item.targetCount<=maxTargets&&(ctx.settings.level!=='adult-plus'||allowedByAdultPlus(item,prefs)),ctx.settings.level==='adult-plus'?adultPlusFilterKey(prefs):'all');
      }catch(error){root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(error.message)}</p><button class="button secondary full" data-back>返回大厅</button></section>`;bindExit(root,ctx);root.querySelector('[data-back]').onclick=ctx.goLobby;return}
      const kingNumber=assignment.get(king.id);
      const available=[...assignment.values()].filter(number=>instruction.allowKingAsTarget||number!==kingNumber);
      targetNumbers=shuffle(available).slice(0,instruction.targetCount);
      renderTask(false);
    };
    const renderTask=(accepted=false,alternative='')=>{
      const display=formatInstruction(alternative||instruction.instruction); const tags=requirementTags(instruction); const needsGate=!accepted&&instruction.consentRequired&&tags.length;
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮 · ${escapeHtml(king.name)} 是国王`)}<section class="game-stage centered"><span class="eyebrow">本轮任务${ctx.settings.level==='adult-plus'?' · 成人进阶':''}</span><div class="target-numbers">${targetNumbers.map(number=>`<span>${number}号</span>`).join('')}</div>${tags.length?`<div class="requirement-tags">${tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div>`:''}<p class="feature-question compact">${escapeHtml(display)}</p>${needsGate?'<section class="consent-gate"><strong>执行玩家逐一确认</strong><p>所有相关玩家明确同意后再开始。拒绝、替代或换题都不会产生额外惩罚。</p></section>':instruction.consentRequired?'<p class="consent-note">所有执行玩家仍可随时停止。</p>':''}<p>国王直接喊号，对应玩家自行响应。</p>${needsGate?'<button class="button primary full" data-agree>所有执行玩家都同意</button>':''}${needsGate&&instruction.alternatives?.length?'<button class="button secondary full" data-alt>使用替代指令</button>':''}<button class="button ghost full" data-change>换一条指令</button>${needsGate?'':'<button class="button primary full" data-complete>完成本轮</button>'}<button class="button ghost full" data-skip>跳过本轮</button></section>`;
      bindExit(root,ctx);
      root.querySelector('[data-agree]')?.addEventListener('click',()=>renderTask(true));
      root.querySelector('[data-alt]')?.addEventListener('click',()=>renderTask(true,instruction.alternatives[0]));
      root.querySelector('[data-change]').onclick=()=>revealTask();
      root.querySelector('[data-complete]')?.addEventListener('click',roundComplete);
      root.querySelector('[data-skip]').onclick=roundComplete;
    };
    const roundComplete=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮完成`)}<section class="game-stage centered"><span class="eyebrow">本轮结束</span><h2>国王：${escapeHtml(king.name)}</h2><p class="result-callout">执行号码：${targetNumbers.map(number=>`${number}号`).join('、')||'已跳过'}</p><button class="button primary full" data-next>重新洗牌，下一轮</button><button class="button secondary full" data-exit-round>结束游戏</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-next]').onclick=startRound;root.querySelector('[data-exit-round]').onclick=ctx.goLobby;
    };
    document.addEventListener('visibilitychange',visibilityGuard);
    ctx.onCleanup(()=>document.removeEventListener('visibilitychange',visibilityGuard));
    function visibilityGuard(){if(document.hidden&&root.querySelector('.secret-number'))renderPass()}
    startRound();
  }
};
registerGame(plugin);
export default plugin;
