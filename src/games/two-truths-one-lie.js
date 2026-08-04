import { registerGame } from './registry.js';
import { escapeHtml, randomInt, shuffle } from '../core/utils.js';
import { bindExit, passScreen, stageHeader } from './shared.js';

const plugin={
  id:'two-truths-one-lie',title:'两个真相一个谎言',sortOrder:2.2,icon:'stories',color:'#6f8fb5',minPlayers:3,maxPlayers:12,supportsAdult:true,
  estimatedTime:'8–25 分钟',shortDescription:'三个提示词，秘密投票后逐条揭秘。',
  description:'每位玩家讲述两个真实故事和一个谎言，只输入三个短提示词。其他人秘密投票，讲述者在投票后逐条揭晓真假。',
  phoneMode:'讲述公开，投票私密传递',resultMode:'猜对次数最少者受罚',defaultSettings:{level:'standard'},
  renderSetup(){return '<div class="info-strip"><strong>玩家原创故事</strong><span>下方尺度仅用于最终惩罚</span></div>'},
  mount(root,ctx){
    let narratorOrder=[];
    let narratorIndex=0;
    let prompts=['','',''];
    let votes=new Map();
    let revealed=[null,null,null];
    let scores=new Map();
    let voteOrder=[];
    let voteIndex=0;
    let scoreApplied=false;

    const narrator=()=>narratorOrder[narratorIndex];
    const votersFor=index=>voteOrder.filter(player=>votes.get(player.id)===index);
    const names=players=>players.length?players.map(player=>escapeHtml(player.name)).join('、'):'无人';

    const reset=()=>{
      narratorOrder=shuffle(ctx.players);
      narratorIndex=0;
      scores=new Map(ctx.players.map(player=>[player.id,0]));
      beginNarrator();
    };

    const beginNarrator=()=>{
      prompts=['','',''];votes=new Map();revealed=[null,null,null];voteIndex=0;scoreApplied=false;
      voteOrder=ctx.players.filter(player=>player.id!==narrator().id);
      renderNarratorPass();
    };

    const renderNarratorPass=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`第 ${narratorIndex+1} / ${narratorOrder.length} 位讲述者`)}${passScreen(narrator(),'输入三个提示词')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=renderPromptForm;
    };

    const renderPromptForm=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`讲述者：${escapeHtml(narrator().name)}`)}<section class="private-stage ttol-input-stage"><span class="eyebrow">只输入区分故事的提示词</span><h2>准备三个故事</h2><p>每条最多 12 个汉字。这里不标记哪一条是谎言。</p><form data-prompt-form>${prompts.map((value,index)=>`<label><span>提示 ${index+1}</span><input maxlength="12" autocomplete="off" data-prompt="${index}" value="${escapeHtml(value)}" placeholder="例如：坐错高铁"></label>`).join('')}<p class="ttol-error" data-error hidden></p><button class="button primary full" type="submit">锁定提示词</button></form></section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-prompt]').forEach(input=>input.addEventListener('input',()=>{prompts[Number(input.dataset.prompt)]=input.value.slice(0,12)}));
      root.querySelector('[data-prompt-form]').onsubmit=event=>{
        event.preventDefault();
        const values=[...root.querySelectorAll('[data-prompt]')].map(input=>input.value.trim());
        const error=root.querySelector('[data-error]');
        if(values.some(value=>!value)){error.hidden=false;error.textContent='三个提示词都需要填写。';return}
        if(new Set(values).size!==3){error.hidden=false;error.textContent='三个提示词不能完全相同。';return}
        prompts=values;renderStoryBoard();
      };
    };

    const renderStoryBoard=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`第 ${narratorIndex+1} / ${narratorOrder.length} 位讲述者`)}<section class="game-stage ttol-story-stage"><span class="eyebrow">${escapeHtml(narrator().name)} 正在讲述</span><h2>两个真相，一个谎言</h2><p>请围绕三个提示词口头讲完故事。投票开始后提示词不可修改。</p><div class="ttol-prompt-list">${prompts.map((prompt,index)=>`<article><span>0${index+1}</span><strong>${escapeHtml(prompt)}</strong></article>`).join('')}</div><button class="button primary full" data-start-vote>我讲完了，开始投票</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-start-vote]').onclick=renderVotePass;
    };

    const renderVotePass=()=>{
      if(voteIndex>=voteOrder.length){renderRevealPass();return}
      const player=voteOrder[voteIndex];
      root.innerHTML=`${stageHeader(plugin.title,`秘密投票 · 已完成 ${voteIndex} / ${voteOrder.length}`)}${passScreen(player,'查看并投票')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=renderVote;
    };

    const renderVote=()=>{
      const player=voteOrder[voteIndex];let selected=null;
      root.innerHTML=`${stageHeader(plugin.title,`秘密投票 · ${voteIndex+1} / ${voteOrder.length}`)}<section class="private-stage ttol-vote-stage" data-vote-private><span class="eyebrow">${escapeHtml(player.name)}</span><h2>哪一个是谎言？</h2><p>选择后立即锁定，不会显示当前票数或其他人的选择。</p><div class="ttol-vote-options">${prompts.map((prompt,index)=>`<button type="button" data-story="${index}" aria-pressed="false"><span>0${index+1}</span><strong>${escapeHtml(prompt)}</strong></button>`).join('')}</div><button class="button primary full" data-confirm-vote disabled>确认并交给下一位</button></section>`;
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

    const visibilityGuard=()=>{
      if(!document.hidden)return;
      if(root.querySelector('[data-prompt-form]')){renderNarratorPass();return}
      if(root.querySelector('[data-vote-private]'))renderVotePass();
    };
    document.addEventListener('visibilitychange',visibilityGuard);
    ctx.onCleanup(()=>document.removeEventListener('visibilitychange',visibilityGuard));

    const renderRevealPass=()=>{
      root.innerHTML=`${stageHeader(plugin.title,'投票已完成 · 结果仍然隐藏')}${passScreen(narrator(),'开始逐条揭秘')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=renderRevealBoard;
    };

    const renderRevealBoard=()=>{
      const complete=revealed.every(value=>value!==null);
      root.innerHTML=`${stageHeader(plugin.title,`逐条揭秘 · ${revealed.filter(value=>value!==null).length} / 3`)}<section class="game-stage ttol-reveal-stage"><span class="eyebrow">讲述者：${escapeHtml(narrator().name)}</span><h2>${complete?'三个故事已全部揭秘':'选择下一条故事'}</h2><p>${complete?'本轮投票结果已经确定。':'每次只能揭晓一条，确认后不能修改。'}</p><div class="ttol-reveal-list">${prompts.map((prompt,index)=>`<button type="button" data-reveal="${index}" class="${revealed[index]===true?'truth':revealed[index]===false?'lie':''}" ${revealed[index]!==null?'disabled':''}><span>0${index+1}</span><strong>${escapeHtml(prompt)}</strong><b>${revealed[index]===true?'真实':revealed[index]===false?'谎言':'尚未揭秘'}</b></button>`).join('')}</div>${complete?'<button class="button primary full" data-round-complete>查看本轮结果</button>':''}</section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-reveal]').forEach(button=>button.onclick=()=>renderRevealChoice(Number(button.dataset.reveal)));
      root.querySelector('[data-round-complete]')?.addEventListener('click',renderRoundComplete);
    };

    const allowedRevealValues=index=>{
      const falseCount=revealed.filter(value=>value===false).length;
      const trueCount=revealed.filter(value=>value===true).length;
      const remaining=revealed.filter(value=>value===null).length;
      if(falseCount>=1)return [true];
      if(trueCount>=2)return [false];
      if(remaining===1)return [false];
      return [true,false];
    };

    const renderRevealChoice=index=>{
      const allowed=allowedRevealValues(index);
      root.innerHTML=`${stageHeader(plugin.title,'确认故事真假')}<section class="game-stage centered ttol-reveal-choice"><span class="eyebrow">故事 ${index+1}</span><h2>${escapeHtml(prompts[index])}</h2><p>确认后立即公布投给本故事的玩家，不能返回修改。</p><div class="dual-actions">${allowed.includes(true)?'<button class="button success full" data-value="true">这是真的</button>':''}${allowed.includes(false)?'<button class="button danger full" data-value="false">这是谎言</button>':''}</div><button class="button ghost full" data-cancel>暂不揭秘</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-cancel]').onclick=renderRevealBoard;
      root.querySelectorAll('[data-value]').forEach(button=>button.onclick=()=>applyReveal(index,button.dataset.value==='true'));
    };

    const applyReveal=(index,value)=>{
      revealed[index]=value;
      if(value===false&&!scoreApplied){
        votersFor(index).forEach(player=>scores.set(player.id,(scores.get(player.id)||0)+1));
        scoreApplied=true;
      }
      renderRevealResult(index);
    };

    const renderRevealResult=index=>{
      const value=revealed[index];
      const voted=votersFor(index);
      const lieIndex=revealed.indexOf(false);
      const correct=lieIndex>=0?voteOrder.filter(player=>votes.get(player.id)===lieIndex):[];
      const wrong=lieIndex>=0?voteOrder.filter(player=>votes.get(player.id)!==lieIndex):voted;
      root.innerHTML=`${stageHeader(plugin.title,'单条揭秘结果')}<section class="game-stage centered ttol-single-result ${value?'truth':'lie'}"><span class="ttol-verdict">${value?'真实':'谎言'}</span><h2>${escapeHtml(prompts[index])}</h2><div class="ttol-result-block"><span>投给这个故事</span><strong>${names(voted)}</strong></div>${value&&lieIndex<0?`<div class="ttol-result-block wrong"><span>已确定猜错</span><strong>${names(voted)}</strong></div><p>其他玩家仍待谎言揭晓后判断。</p>`:`<div class="ttol-result-columns"><div><span>本轮猜对</span><strong>${names(correct)}</strong></div><div><span>本轮猜错</span><strong>${names(wrong)}</strong></div></div>`}<button class="button primary full" data-continue>继续揭秘</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-continue]').onclick=renderRevealBoard;
    };

    const renderRoundComplete=()=>{
      const lieIndex=revealed.indexOf(false);
      const correct=voteOrder.filter(player=>votes.get(player.id)===lieIndex);
      const wrong=voteOrder.filter(player=>votes.get(player.id)!==lieIndex);
      root.innerHTML=`${stageHeader(plugin.title,`第 ${narratorIndex+1} / ${narratorOrder.length} 位完成`)}<section class="game-stage centered"><span class="eyebrow">本轮谎言</span><h2>${escapeHtml(prompts[lieIndex])}</h2><div class="ttol-result-columns"><div><span>猜对</span><strong>${names(correct)}</strong></div><div><span>猜错</span><strong>${names(wrong)}</strong></div></div><button class="button primary full" data-next>${narratorIndex+1>=narratorOrder.length?'查看最终计分':'下一位讲述者'}</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-next]').onclick=()=>{
        narratorIndex++;
        narratorIndex>=narratorOrder.length?renderFinal():beginNarrator();
      };
    };

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
