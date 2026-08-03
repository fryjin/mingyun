import { registerGame } from './registry.js';
import { escapeHtml, randomInt, tone, vibrate } from '../core/utils.js';
import { animateLite, prefersReducedMotion } from '../core/motion.js';
import { bindExit, stageHeader } from './shared.js';

const colors=['#8b5cf6','#ec4899','#06b6d4','#f59e0b','#22c55e','#ef4444','#3b82f6','#a855f7','#14b8a6','#f97316','#84cc16','#e879f9'];

function spinProgress(t){
  const acceleration=.18,cruise=.20,deceleration=.62,maxVelocity=1/(acceleration/2+cruise+deceleration/2);
  if(t<acceleration)return .5*(t*t/acceleration)*maxVelocity;
  if(t<acceleration+cruise)return (acceleration/2+(t-acceleration))*maxVelocity;
  const u=t-acceleration-cruise;
  return (acceleration/2+cruise+u-u*u/(2*deceleration))*maxVelocity;
}

const plugin={
  id:'wheel',title:'命运转盘',sortOrder:4,icon:'wheel',color:'#f472b6',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'30 秒',shortDescription:'转动转盘，随机选出一位玩家。',
  description:'点击转动，指针停在哪位玩家，那位玩家就接受本轮惩罚。',
  phoneMode:'一人点击即可',resultMode:'转盘随机选人',defaultSettings:{turns:5,level:'standard'},
  renderSetup(settings){
    return `<div class="setting-block"><div class="setting-label"><span>转动节奏</span><small>动画时长</small></div><div class="segmented" data-turns><button type="button" data-segment data-value="4" class="${settings.turns===4?'active':''}">轻快</button><button type="button" data-segment data-value="5" class="${settings.turns===5?'active':''}">标准</button><button type="button" data-segment data-value="7" class="${settings.turns===7?'active':''}">更久</button></div></div>`;
  },
  readSetup(sheet){return {turns:Number(sheet.querySelector('[data-turns] .active')?.dataset.value||5)}},
  mount(root,ctx){
    let rotation=0,spinning=false,frameId=null;
    const count=ctx.players.length,step=360/count;
    const gradient=ctx.players.map((_,index)=>`${colors[index%colors.length]} ${index*step}deg ${(index+1)*step}deg`).join(',');
    root.innerHTML=`${stageHeader(plugin.title,`${count} 位玩家`)}<section class="game-stage centered wheel-game"><div class="wheel-wrap" data-wheel-wrap><span class="wheel-pointer" data-pointer></span><div class="wheel" style="--wheel:${gradient}" data-wheel>${ctx.players.map((player,index)=>`<span class="wheel-label" style="--i:${index};--n:${count}">${escapeHtml(player.name)}</span>`).join('')}</div><div class="wheel-hub">GO</div></div><button class="button primary large" data-spin>转动命运</button></section>`;
    bindExit(root,ctx);
    const wheel=root.querySelector('[data-wheel]'),pointer=root.querySelector('[data-pointer]'),wrap=root.querySelector('[data-wheel-wrap]'),button=root.querySelector('[data-spin]');
    ctx.onCleanup(()=>cancelAnimationFrame(frameId));
    button.onclick=()=>{
      if(spinning)return;spinning=true;button.disabled=true;button.textContent='转动中…';
      const winnerIndex=randomInt(0,count-1),turns=ctx.settings.turns||5;
      const start=rotation,startNormalized=((start%360)+360)%360,targetNormalized=(360-(winnerIndex*step+step/2))%360;
      const delta=(targetNormalized-startNormalized+360)%360,end=start+turns*360+delta;
      const duration=prefersReducedMotion()?80:3900+turns*150,startAt=performance.now();let lastTick=Math.floor(start/step);
      animateLite(wrap,{scale:[1,.975,1.012,1],duration:520,ease:'out(3)'});
      const frame=now=>{
        const t=Math.min(1,(now-startAt)/duration),progress=spinProgress(t);
        rotation=start+(end-start)*progress;wheel.style.transform=`rotate(${rotation}deg)`;
        const tick=Math.floor(rotation/step);
        if(tick!==lastTick){
          lastTick=tick;tone(255+Math.max(0,1-t)*95,.018,ctx.global.sound,.015);vibrate(4,ctx.global.haptics);
          animateLite(pointer,{y:[0,4,0],rotate:[0,-12,0],duration:92,ease:'out(3)'});
        }
        if(t<1)frameId=requestAnimationFrame(frame);
        else settle(end,ctx.players[winnerIndex]);
      };
      frameId=requestAnimationFrame(frame);
    };
    const settle=async(end,player)=>{
      rotation=end;wheel.style.transform=`rotate(${end}deg)`;
      if(!prefersReducedMotion()){
        const rebound=wheel.animate([
          {transform:`rotate(${end}deg)`},
          {transform:`rotate(${end+4}deg)`},
          {transform:`rotate(${end-1.4}deg)`},
          {transform:`rotate(${end}deg)`}
        ],{duration:420,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
        try{await rebound.finished}catch{}
      }
      vibrate([35,35,72],ctx.global.haptics);tone(520,.12,ctx.global.sound,.04);spinning=false;showResult(player);
    };
    function showResult(player){
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">转盘停下</span><h2>${escapeHtml(player.name)} 遭殃</h2><div class="winner-orb" data-winner>${escapeHtml([...player.name][0])}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-again>再转一次</button></section>`;
      bindExit(root,ctx);animateLite(root.querySelector('[data-winner]'),{y:[20,-5,0],scale:[.45,1.12,1],opacity:[0,1,1],duration:650,ease:'out(4)'});
      root.querySelector('[data-punish]').onclick=()=>ctx.punishment([player],{onDone:()=>plugin.mount(root,ctx)});root.querySelector('[data-again]').onclick=()=>plugin.mount(root,ctx);
    }
  }
};
registerGame(plugin);
export default plugin;
