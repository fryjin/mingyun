import { registerGame } from './registry.js';
import { drawGame } from '../modules/questions.js';
import { escapeHtml, shuffle, randomInt, tone, vibrate } from '../core/utils.js';
import { bindExit, passScreen, stageHeader } from './shared.js';

const speechOptions=[0,15,30,45,60];
const plugin={
  id:'undercover',title:'谁是卧底',sortOrder:5,icon:'mask',color:'#34d399',minPlayers:4,maxPlayers:12,supportsAdult:true,
  estimatedTime:'8–20 分钟',shortDescription:'看词、描述、投票找出卧底。',
  description:'每个人只会看到自己的词。轮流描述后投票，找出拿到不同词的人。',
  phoneMode:'逐人私密传递',resultMode:'找出不同词玩家',
  defaultSettings:{undercoverCount:1,speechSeconds:30,level:'standard'},levelOptions:['light','standard','bold','adult'],
  renderSetup(settings){
    return `<div class="setting-block"><div class="setting-label"><span>卧底人数</span><small>建议每 6 人 1 名</small></div><div class="time-stepper"><button type="button" data-uc-minus>−</button><input data-uc-count type="number" min="1" max="3" value="${settings.undercoverCount||1}"><button type="button" data-uc-plus>＋</button></div></div><div class="setting-block"><div class="setting-label"><span>发言时限</span><small>默认 30 秒</small></div><div class="segmented compact-options" data-speech>${speechOptions.map(number=>`<button type="button" data-segment data-value="${number}" class="${Number(settings.speechSeconds)===number?'active':''}">${number?`${number}秒`:'不限'}</button>`).join('')}</div></div>`;
  },
  bindSetup(sheet){
    const input=sheet.querySelector('[data-uc-count]');
    sheet.querySelector('[data-uc-minus]').onclick=()=>input.value=Math.max(1,Number(input.value)-1);
    sheet.querySelector('[data-uc-plus]').onclick=()=>input.value=Math.min(3,Number(input.value)+1);
  },
  readSetup(sheet){return {undercoverCount:Number(sheet.querySelector('[data-uc-count]').value||1),speechSeconds:Number(sheet.querySelector('[data-speech] .active')?.dataset.value||30)}},
  async mount(root,ctx){
    const settings={...ctx.settings,undercoverCount:Math.min(ctx.settings.undercoverCount||1,Math.max(1,ctx.players.length-2))};
    let pair;
    try{pair=await drawGame('undercover',settings.level)}catch(error){root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><p>${escapeHtml(error.message)}</p></section>`;bindExit(root,ctx);return}
    let alive=[...ctx.players],roles=new Map(),viewIndex=0,speakerIndex=0,voterIndex=0,votes=[],round=1,timer=null;
    const undercoverIds=new Set(shuffle(ctx.players).slice(0,settings.undercoverCount).map(player=>player.id));
    ctx.players.forEach(player=>roles.set(player.id,undercoverIds.has(player.id)?'undercover':'civilian'));
    const startView=()=>{viewIndex=0;renderPass()};
    const renderPass=()=>{
      const player=ctx.players[viewIndex];
      root.innerHTML=`${stageHeader(plugin.title,'私密看词')}${passScreen(player,'查看我的词')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=()=>renderWord(player);
    };
    const renderWord=player=>{
      const word=roles.get(player.id)==='undercover'?pair.undercover:pair.civilian;
      root.innerHTML=`${stageHeader(plugin.title)}<section class="private-stage secret-card word-only"><span class="eyebrow">${escapeHtml(player.name)} 的词</span><div class="secret-word single-line">${escapeHtml(word)}</div><button class="button primary full" data-remember>我记住了</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-remember]').onclick=()=>{viewIndex++;viewIndex>=ctx.players.length?readySpeech():renderPass()};
    };
    const readySpeech=()=>{
      speakerIndex=0;
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">全部看完</span><h2>开始描述</h2><p>不要直接说出词。</p><button class="button primary full" data-speak>开始发言</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-speak]').onclick=renderSpeaker;
    };
    const renderSpeaker=()=>{
      const player=alive[speakerIndex];let remain=settings.speechSeconds;
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮发言`)}<section class="game-stage centered"><span class="eyebrow">当前发言</span><h2>${escapeHtml(player.name)}</h2>${remain?`<div class="speech-timer" data-time>${remain}</div>`:'<div class="speech-timer unlimited">∞</div>'}<button class="button primary full" data-finish>说完了</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-finish]').onclick=nextSpeaker;
      if(remain){
        const started=performance.now();let lastSecond=remain;
        const frame=now=>{
          remain=Math.max(0,settings.speechSeconds-(now-started)/1000);
          const current=Math.ceil(remain);
          root.querySelector('[data-time]')?.replaceChildren(String(current));
          if(current!==lastSecond&&current<=5&&current>0){lastSecond=current;tone(400+current*40,.03,ctx.global.sound,.02)}
          if(remain>0)timer=requestAnimationFrame(frame);
          else{vibrate([40,30,40],ctx.global.haptics);nextSpeaker()}
        };
        timer=requestAnimationFrame(frame);ctx.onCleanup(()=>cancelAnimationFrame(timer));
      }
    };
    function nextSpeaker(){cancelAnimationFrame(timer);speakerIndex++;speakerIndex>=alive.length?readyVote():renderSpeaker()}
    const readyVote=()=>{
      voterIndex=0;votes=[];
      root.innerHTML=`${stageHeader(plugin.title,`第 ${round} 轮`)}<section class="game-stage centered"><span class="eyebrow">发言结束</span><h2>开始投票</h2><button class="button primary full" data-vote>进入秘密投票</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-vote]').onclick=votePass;
    };
    const votePass=()=>{
      const voter=alive[voterIndex];
      root.innerHTML=`${stageHeader(plugin.title)}${passScreen(voter,'进入投票')}`;
      bindExit(root,ctx);root.querySelector('[data-private-open]').onclick=()=>voteScreen(voter);
    };
    const voteScreen=voter=>{
      root.innerHTML=`${stageHeader(plugin.title)}<section class="private-stage"><span class="eyebrow">${escapeHtml(voter.name)}</span><h2>投给谁？</h2><div class="player-choice-grid">${alive.filter(player=>player.id!==voter.id).map(player=>`<button data-candidate="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div></section>`;
      bindExit(root,ctx);root.querySelectorAll('[data-candidate]').forEach(button=>button.onclick=()=>{votes.push(button.dataset.candidate);voterIndex++;voterIndex>=alive.length?revealVote():votePass()});
    };
    const revealVote=()=>{
      const counts=new Map(alive.map(player=>[player.id,0]));votes.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
      const max=Math.max(...counts.values());const tied=alive.filter(player=>counts.get(player.id)===max);const eliminated=tied[randomInt(0,tied.length-1)];
      alive=alive.filter(player=>player.id!==eliminated.id);
      const underAlive=alive.filter(player=>roles.get(player.id)==='undercover').length,civAlive=alive.length-underAlive;
      const winner=underAlive===0?'civilian':underAlive>=civAlive?'undercover':null;
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">投票结果</span><h2>${escapeHtml(eliminated.name)} 出局</h2>${winner?`<h3>${winner==='civilian'?'相同词阵营获胜':'不同词阵营获胜'}</h3><div class="word-pair-result"><span>${escapeHtml(pair.civilian)}</span><b>VS</b><span>${escapeHtml(pair.undercover)}</span></div><button class="button primary full" data-new>重新开局</button>`:`<p>身份暂不公开，继续下一轮。</p><button class="button primary full" data-next>下一轮</button>`}</section>`;
      bindExit(root,ctx);root.querySelector('[data-new]')?.addEventListener('click',()=>plugin.mount(root,ctx));root.querySelector('[data-next]')?.addEventListener('click',()=>{round++;readySpeech()});
    };
    document.addEventListener('visibilitychange',guard);ctx.onCleanup(()=>document.removeEventListener('visibilitychange',guard));
    function guard(){if(document.hidden&&root.querySelector('.secret-card'))renderPass()}
    startView();
  }
};
registerGame(plugin);
export default plugin;
