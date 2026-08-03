import { registerGame } from './registry.js';
import { drawGame } from '../modules/questions.js';
import { escapeHtml, shuffle, pick } from '../core/utils.js';
import { bindExit, passScreen, stageHeader } from './shared.js';
const plugin={
 id:'king',title:'国王游戏',sortOrder:2,icon:'crown',color:'#f59e0b',minPlayers:3,maxPlayers:12,supportsAdult:true,estimatedTime:'2–5 分钟/轮',shortDescription:'每轮重新洗牌，国王按号码发布指令。',description:'每轮重新分配所有号码并逐人私密查看；随后随机揭晓国王、指令和执行号码。系统不会公开号码对应的真实玩家。',phoneMode:'逐人私密传递',resultMode:'按号码完成国王指令',defaultSettings:{level:'standard'},
 renderSetup(){return `<div class="info-strip"><strong>每轮重新洗牌</strong><span>号码、国王和执行号码都会重新随机</span></div>`},
 async mount(root,ctx){
  let round=0,assignment=new Map(),viewIndex=0,king=null,instruction=null,targetNumbers=[];
  const startRound=async()=>{
    round++; viewIndex=0; king=null; instruction=null; targetNumbers=[];
    const numbers=shuffle(Array.from({length:ctx.players.length},(_,i)=>i+1));
    assignment=new Map(ctx.players.map((p,i)=>[p.id,numbers[i]]));
    renderRoundReady();
  };
  const renderRoundReady=()=>{
    root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">新一轮</span><h2>重新分配号码</h2><p>本轮所有号码已经重新洗牌。接下来请按派对房间顺序传递手机，每个人自己查看号码。</p><button class="button primary full" data-begin>开始查看号码</button></section>`;
    bindExit(root,ctx);root.querySelector('[data-begin]').onclick=renderPass;
  };
  const renderPass=()=>{
    const player=ctx.players[viewIndex];
    root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮 · 号码查看`)}${passScreen(player,'查看我的号码')}`;
    bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=()=>renderNumber(player);
  };
  const renderNumber=player=>{
    const number=assignment.get(player.id);
    root.innerHTML=`${stageHeader(plugin.title)}<section class="private-stage secret-card"><span class="eyebrow">${escapeHtml(player.name)}</span><p>你本轮的号码是</p><div class="secret-number">${number}</div><p>请记住号码，不要告诉其他人。</p><button class="button primary full" data-remember>我记住了</button></section>`;
    bindExit(root,ctx);root.querySelector('[data-remember]').onclick=()=>{viewIndex++; if(viewIndex>=ctx.players.length)renderNumbersComplete();else renderPass()};
  };
  const renderNumbersComplete=()=>{
    root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">号码查看完成</span><h2>准备揭晓国王</h2><p>所有玩家都已记住本轮号码。接下来随机抽取本轮国王。</p><button class="button primary full" data-king>揭晓本轮国王</button></section>`;
    bindExit(root,ctx);root.querySelector('[data-king]').onclick=revealKing;
  };
  const revealKing=()=>{
    king=pick(ctx.players);
    root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered king-reveal"><span class="eyebrow">本轮国王</span><div class="crown-mark">♛</div><h2>${escapeHtml(king.name)}</h2><p>国王仍然保留自己的号码，但默认不会成为执行目标。</p><button class="button primary full" data-instruction>揭晓本轮指令</button></section>`;
    bindExit(root,ctx);root.querySelector('[data-instruction]').onclick=revealInstruction;
  };
  const revealInstruction=async()=>{
    const maxTargets=Math.max(1,ctx.players.length-1);
    instruction=await drawGame('king',ctx.settings.level,item=>item.targetCount<=maxTargets);
    const clean=instruction.instruction.replace(/\{target\d+\}/g,'指定号码');
    root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮 · ${escapeHtml(king.name)} 是国王`)}<section class="game-stage centered"><span class="eyebrow">本轮指令</span><p class="feature-question">${escapeHtml(clean)}</p>${instruction.consentRequired?'<p class="consent-note">互动任务必须先取得所有相关玩家明确同意，任何人都可以跳过。</p>':''}<button class="button primary full" data-targets>抽取执行号码</button></section>`;
    bindExit(root,ctx);root.querySelector('[data-targets]').onclick=drawTargets;
  };
  const drawTargets=()=>{
    const kingNumber=assignment.get(king.id);
    const available=[...assignment.values()].filter(number=>instruction.allowKingAsTarget||number!==kingNumber);
    targetNumbers=shuffle(available).slice(0,instruction.targetCount);
    const display=instruction.instruction.replace(/\{target(\d+)\}/g,(_,n)=>`${targetNumbers[Number(n)-1]}号`);
    root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮 · 执行号码`)}<section class="game-stage centered"><span class="eyebrow">抽签结果</span><div class="target-numbers">${targetNumbers.map(n=>`<span>${n}号</span>`).join('')}</div><p class="feature-question compact">${escapeHtml(display)}</p><p>系统不会显示号码对应的真实玩家。请由国王喊号，相关玩家自行响应。</p><button class="button primary full" data-complete>完成本轮指令</button><button class="button ghost full" data-skip>跳过本轮</button></section>`;
    bindExit(root,ctx);root.querySelector('[data-complete]').onclick=roundComplete;root.querySelector('[data-skip]').onclick=roundComplete;
  };
  const roundComplete=()=>{
    root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮完成`)}<section class="game-stage centered"><span class="eyebrow">本轮完成</span><h2>国王：${escapeHtml(king.name)}</h2><p class="result-callout">执行号码：${targetNumbers.map(n=>`${n}号`).join('、')||'已跳过'}</p><button class="button primary full" data-next>重新洗牌，开始下一轮</button><button class="button secondary full" data-exit-round>结束国王游戏</button></section>`;
    bindExit(root,ctx);root.querySelector('[data-next]').onclick=startRound;root.querySelector('[data-exit-round]').onclick=ctx.goLobby;
  };
  document.addEventListener('visibilitychange',visibilityGuard);
  ctx.onCleanup(()=>document.removeEventListener('visibilitychange',visibilityGuard));
  function visibilityGuard(){if(document.hidden&&root.querySelector('.secret-number'))renderPass()}
  startRound();
 }
};registerGame(plugin);export default plugin;
