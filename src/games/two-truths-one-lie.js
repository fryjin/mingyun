import { registerGame } from './registry.js';
import { escapeHtml, randomInt, shuffle } from '../core/utils.js';
import { bindExit, passScreen, stageHeader } from './shared.js';

const plugin={
  id:'two-truths-one-lie',title:'两个真相一个谎言',sortOrder:2.2,icon:'stories',color:'#6f8fb5',minPlayers:3,maxPlayers:12,supportsAdult:true,
  estimatedTime:'8–25 分钟',shortDescription:'三个提示词，秘密投票后逐条揭秘。',
  description:'讲述者输入三个短提示词并口头讲完故事，其他人秘密投票。投票结束后讲述者锁定谎言，再在同一页面逐条揭晓。',
  phoneMode:'讲述公开，投票私密传递',resultMode:'猜对次数最少者受罚',defaultSettings:{level:'standard'},
  renderSetup(){return '<div class="info-strip"><strong>玩家原创故事</strong><span>下方尺度仅用于最终惩罚</span></div>'},
  mount(root,ctx){
    let narratorOrder=[];
    let narratorIndex=0;
    let prompts=['','',''];
    let votes=new Map();
    let scores=new Map();
    let voteOrder=[];
    let voteIndex=0;
    let lieIndex=null;
    let revealed=new Set();
    let scoreApplied=false;

    const narrator=()=>narratorOrder[narratorIndex];
    const votersFor=index=>voteOrder.filter(player=>votes.get(player.id)===index);
    const names=players=>players.length?players.map(player=>escapeHtml(player.name)).join('、'):'无人';
    const correctPlayers=()=>lieIndex===null?[]:voteOrder.filter(player=>votes.get(player.id)===lieIndex);
    const wrongPlayers=()=>lieIndex===null?[]:voteOrder.filter(player=>votes.get(player.id)!==lieIndex);

    const reset=()=>{
      narratorOrder=shuffle(ctx.players);
      narratorIndex=0;
      scores=new Map(ctx.players.map(player=>[player.id,0]));
      beginNarrator();
    };

    const beginNarrator=()=>{
      prompts=['','',''];
      votes=new Map();
      voteIndex=0;
      lieIndex=null;
      revealed=new Set();
      scoreApplied=false;
      voteOrder=ctx.players.filter(player=>player.id!==narrator().id);
      renderNarratorPass();
    };

    const renderNarratorPass=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`第 ${narratorIndex+1} / ${narratorOrder.length} 位讲述者`)}${passScreen(narrator(),'准备三个故事')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=renderComposer;
    };

    const renderComposer=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`讲述者：${escapeHtml(narrator().name)}`)}<section class="game-stage ttol-composer-stage" data-narrator-private><span class="eyebrow">输入提示词并直接讲述</span><h2>两个真相，一个谎言</h2><p>每条只写一个用于区分故事的短提示词。填写后直接围绕提示词讲述，全部讲完再开始投票。</p><form data-prompt-form>${prompts.map((value,index)=>`<label><span>故事 ${index+1}</span><input maxlength="12" autocomplete="off" data-prompt="${index}" value="${escapeHtml(value)}" placeholder="例如：坐错高铁"></label>`).join('')}<p class="ttol-error" data-error hidden></p><button class="button primary full" type="submit">故事讲完，开始投票</button></form></section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-prompt]').forEach(input=>input.addEventListener('input',()=>{prompts[Number(input.dataset.prompt)]=input.value.slice(0,12)}));
      root.querySelector('[data-prompt-form]').onsubmit=event=>{
        event.preventDefault();
        const values=[...root.querySelectorAll('[data-prompt]')].map(input=>input.value.trim());
        const error=root.querySelector('[data-error]');
        if(values.some(value=>!value)){error.hidden=false;error.textContent='三个提示词都需要填写。';return}
        if(new Set(values).size!==3){error.hidden=false;error.textContent='三个提示词不能完全相同。';return}
        prompts=values;
        renderVotePass();
      };
    };

    const renderVotePass=()=>{
      if(voteIndex>=voteOrder.length){renderAnswerPass();return}
      const player=voteOrder[voteIndex];
      root.innerHTML=`${stageHeader(plugin.title,`秘密投票 · 已完成 ${voteIndex} / ${voteOrder.length}`)}${passScreen(player,'开始投票')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=renderVote;
    };

    const renderVote=()=>{
      const player=voteOrder[voteIndex];let selected=null;
      root.innerHTML=`${stageHeader(plugin.title,`秘密投票 · ${voteIndex+1} / ${voteOrder.length}`)}<section class="private-stage ttol-vote-stage" data-vote-private><span class="eyebrow">${escapeHtml(player.name)}</span><h2>哪一个是谎言？</h2><p>选择后立即锁定。这里不会显示票数或其他人的选择。</p><div class="ttol-vote-options">${prompts.map((prompt,index)=>`<button type="button" data-story="${index}" aria-pressed="false"><span>0${index+1}</span><strong>${escapeHtml(prompt)}</strong></button>`).join('')}</div><button class="button primary full" data-confirm-vote disabled>确认投票</button></section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-story]').forEach(button=>button.onclick=()=>{
        selected=Number(button.dataset.story);
        root.querySelectorAll('[data-story]').forEach(node=>{const active=Number(node.dataset.story)===selected;node.classList.toggle('active',active);node.setAttribute('aria-pressed',String(active))});
        root.querySelector('[data-confirm-vote]').disabled=false;
      });
      root.querySelector('[data-confirm-vote]').onclick=()=>{
        votes.set(player.id,selected);voteIndex++;renderVotePass();
      };
    };

    const renderAnswerPass=()=>{
      root.innerHTML=`${stageHeader(plugin.title,'投票已完成 · 结果仍然隐藏')}${passScreen(narrator(),'锁定谎言并开始揭秘')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=renderLiePicker;
    };

    const renderLiePicker=()=>{
      let selected=null;
      root.innerHTML=`${stageHeader(plugin.title,'讲述者锁定答案')}<section class="private-stage ttol-answer-stage" data-answer-private><span class="eyebrow">${escapeHtml(narrator().name)}</span><h2>真正的谎言是哪一个？</h2><p>投票结果仍然隐藏。选择一次即可，另外两个故事会自动认定为真相。</p><div class="ttol-vote-options">${prompts.map((prompt,index)=>`<button type="button" data-lie="${index}" aria-pressed="false"><span>0${index+1}</span><strong>${escapeHtml(prompt)}</strong></button>`).join('')}</div><button class="button primary full" data-lock-lie disabled>锁定答案，开始揭秘</button></section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-lie]').forEach(button=>button.onclick=()=>{
        selected=Number(button.dataset.lie);
        root.querySelectorAll('[data-lie]').forEach(node=>{const active=Number(node.dataset.lie)===selected;node.classList.toggle('active',active);node.setAttribute('aria-pressed',String(active))});
        root.querySelector('[data-lock-lie]').disabled=false;
      });
      root.querySelector('[data-lock-lie]').onclick=()=>{lieIndex=selected;renderRevealBoard()};
    };

    const revealCard=(prompt,index)=>{
      const isRevealed=revealed.has(index);
      const isLie=index===lieIndex;
      if(!isRevealed){
        return `<button type="button" class="ttol-reveal-card pending" data-reveal="${index}"><span>0${index+1}</span><strong>${escapeHtml(prompt)}</strong><b>点击揭晓</b></button>`;
      }
      const voted=votersFor(index);
      const detail=isLie
        ? `<div class="ttol-inline-results"><div><span>本轮猜对</span><strong>${names(correctPlayers())}</strong></div><div><span>本轮猜错</span><strong>${names(wrongPlayers())}</strong></div></div>`
        : `<div class="ttol-inline-votes"><span>投给这个故事</span><strong>${names(voted)}</strong><small>${voted.length?'这些玩家已确定猜错。':'没有人投给这个故事。'}</small></div>`;
      return `<article class="ttol-reveal-card ${isLie?'lie':'truth'}"><span>0${index+1}</span><strong>${escapeHtml(prompt)}</strong><b>${isLie?'谎言':'真实'}</b>${detail}</article>`;
    };

    const renderRevealBoard=()=>{
      const complete=revealed.size===3;
      root.innerHTML=`${stageHeader(plugin.title,`逐条揭秘 · ${revealed.size} / 3`)}<section class="game-stage ttol-reveal-stage"><span class="eyebrow">讲述者：${escapeHtml(narrator().name)}</span><h2>${complete?'本轮揭秘完成':'每次揭晓一个故事'}</h2><p>${complete?'本轮分数已经记录。':'点击任意未揭秘故事，结果会直接留在当前页面。'}</p><div class="ttol-reveal-board">${prompts.map(revealCard).join('')}</div>${complete?`<section class="ttol-round-summary"><div><span>猜对</span><strong>${names(correctPlayers())}</strong></div><div><span>猜错</span><strong>${names(wrongPlayers())}</strong></div></section><button class="button primary full" data-next>${narratorIndex+1>=narratorOrder.length?'查看最终计分':'下一位讲述者'}</button>`:''}</section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-reveal]').forEach(button=>button.onclick=()=>applyReveal(Number(button.dataset.reveal)));
      root.querySelector('[data-next]')?.addEventListener('click',()=>{
        narratorIndex++;
        narratorIndex>=narratorOrder.length?renderFinal():beginNarrator();
      });
    };

    const applyReveal=index=>{
      if(revealed.has(index))return;
      revealed.add(index);
      if(index===lieIndex&&!scoreApplied){
        correctPlayers().forEach(player=>scores.set(player.id,(scores.get(player.id)||0)+1));
        scoreApplied=true;
      }
      renderRevealBoard();
    };

    const visibilityGuard=()=>{
      if(!document.hidden)return;
      if(root.querySelector('[data-narrator-private]')){renderNarratorPass();return}
      if(root.querySelector('[data-vote-private]')){renderVotePass();return}
      if(root.querySelector('[data-answer-private]'))renderAnswerPass();
    };
    document.addEventListener('visibilitychange',visibilityGuard);
    ctx.onCleanup(()=>document.removeEventListener('visibilitychange',visibilityGuard));

    const renderFinal=()=>{
      const ordered=[...ctx.players].sort((a,b)=>(scores.get(b.id)||0)-(scores.get(a.id)||0));
      const minimum=Math.min(...ctx.players.map(player=>scores.get(player.id)||0));
      const tied=ctx.players.filter(player=>(scores.get(player.id)||0)===minimum);
      const loser=tied[randomInt(0,tied.length-1)];
      root.innerHTML=`${stageHeader(plugin.title,'最终计分')}<section class="game-stage centered ttol-final"><span class="eyebrow">猜对次数排名</span><h2>${escapeHtml(loser.name)} 遭殃</h2>${tied.length>1?'<p>最低分并列，系统随机选出一位。</p>':''}<div class="ttol-score-list">${ordered.map((player,index)=>`<div class="${player.id===loser.id?'loser':''}"><span>${index+1}</span><strong>${escapeHtml(player.name)}</strong><b>${scores.get(player.id)||0} 次</b></div>`).join('')}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-restart>再来一局</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-punish]').onclick=()=>ctx.punishment([loser],{onDone:reset});root.querySelector('[data-restart]').onclick=reset;
    };

    reset();
  }
};
registerGame(plugin);
export default plugin;
