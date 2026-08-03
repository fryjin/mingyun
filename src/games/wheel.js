import { registerGame } from './registry.js';
import { escapeHtml, randomInt, tone, vibrate } from '../core/utils.js';
import { animateLite, prefersReducedMotion } from '../core/motion.js';
import { bindExit, stageHeader } from './shared.js';

const RED='#b91c1c';
const BLACK='#111318';

function profileProgress(t, acceleration=.16, cruise=.18, deceleration=.66){
  const maxVelocity=1/(acceleration/2+cruise+deceleration/2);
  if(t<acceleration)return .5*(t*t/acceleration)*maxVelocity;
  if(t<acceleration+cruise)return (acceleration/2+(t-acceleration))*maxVelocity;
  const u=t-acceleration-cruise;
  return (acceleration/2+cruise+u-u*u/(2*deceleration))*maxVelocity;
}

const plugin={
  id:'wheel',title:'命运转盘',sortOrder:4,icon:'wheel',color:'#d4af61',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'30 秒',shortDescription:'转动赌场轮盘，随机选出一位玩家。',
  description:'转动轮盘，小球最终落在哪位玩家的色格，那位玩家就接受本轮惩罚。',
  phoneMode:'一人点击即可',resultMode:'轮盘随机选人',defaultSettings:{turns:5,level:'standard'},
  renderSetup(settings){
    return `<div class="setting-block"><div class="setting-label"><span>转动节奏</span><small>动画时长</small></div><div class="segmented" data-turns><button type="button" data-segment data-value="4" class="${settings.turns===4?'active':''}">轻快</button><button type="button" data-segment data-value="5" class="${settings.turns===5?'active':''}">标准</button><button type="button" data-segment data-value="7" class="${settings.turns===7?'active':''}">更久</button></div></div>`;
  },
  readSetup(sheet){return {turns:Number(sheet.querySelector('[data-turns] .active')?.dataset.value||5)}},
  mount(root,ctx){
    let rotation=0,ballRotation=0,spinning=false,frameId=null;
    const count=ctx.players.length,step=360/count;
    const pockets=ctx.players.map((_,index)=>`${index%2===0?RED:BLACK} ${index*step}deg ${(index+1)*step}deg`).join(',');
    const labels=ctx.players.map((player,index)=>`<span class="casino-pocket-label" style="--i:${index};--n:${count}"><b>${escapeHtml(player.name)}</b></span>`).join('');
    root.innerHTML=`${stageHeader(plugin.title,`${count} 位玩家`)}<section class="game-stage centered casino-wheel-game"><div class="casino-felt"><div class="casino-wheel-assembly" data-assembly><span class="casino-top-marker" aria-hidden="true"></span><div class="casino-wood-rim"><div class="casino-gold-rim"><div class="casino-ball-track"><div class="casino-ball-orbit" data-ball-orbit><span class="casino-ball" data-ball></span></div><div class="casino-wheel-disc" data-wheel style="--step:${step}deg;--pockets:${pockets}">${labels}<span class="casino-inner-bowl"></span></div><div class="casino-spindle" aria-hidden="true"></div></div></div></div></div><p class="casino-hint">小球落入的色格决定本轮玩家</p><button class="button primary large casino-spin-button" data-spin>转动轮盘</button></section>`;
    bindExit(root,ctx);
    const wheel=root.querySelector('[data-wheel]');
    const orbit=root.querySelector('[data-ball-orbit]');
    const ball=root.querySelector('[data-ball]');
    const assembly=root.querySelector('[data-assembly]');
    const button=root.querySelector('[data-spin]');
    ctx.onCleanup(()=>cancelAnimationFrame(frameId));

    button.onclick=()=>{
      if(spinning)return;
      spinning=true;button.disabled=true;button.textContent='轮盘转动中…';
      const winnerIndex=randomInt(0,count-1),turns=ctx.settings.turns||5;
      const start=rotation;
      const startNormalized=((start%360)+360)%360;
      const centerAngle=winnerIndex*step+step/2;
      const targetNormalized=(360-centerAngle)%360;
      const delta=(targetNormalized-startNormalized+360)%360;
      const end=start+turns*360+delta;
      const ballStart=ballRotation;
      const ballEnd=ballStart-(turns+4)*360;
      const duration=prefersReducedMotion()?120:4300+turns*170;
      const started=performance.now();
      let lastTick=Math.floor(start/step);
      animateLite(assembly,{scale:[1,.985,1.008,1],duration:620,ease:'out(3)'});

      const frame=now=>{
        const t=Math.min(1,(now-started)/duration);
        const wheelProgress=profileProgress(t,.16,.18,.66);
        const ballProgress=profileProgress(t,.10,.12,.78);
        rotation=start+(end-start)*wheelProgress;
        ballRotation=ballStart+(ballEnd-ballStart)*ballProgress;
        wheel.style.transform=`rotate(${rotation}deg)`;
        orbit.style.transform=`rotate(${ballRotation}deg)`;
        const hop=t>.72?Math.sin((t-.72)*Math.PI*13)*Math.max(0,(1-t))*18:0;
        ball.style.transform=`translate(-50%,-50%) translateY(${Math.max(0,hop)}px)`;
        const tick=Math.floor(rotation/step);
        if(tick!==lastTick){
          lastTick=tick;
          tone(220+Math.max(0,1-t)*120,.017,ctx.global.sound,.014);
          vibrate(3,ctx.global.haptics);
        }
        if(t<1)frameId=requestAnimationFrame(frame);
        else settle(end,ballEnd,ctx.players[winnerIndex],winnerIndex);
      };
      frameId=requestAnimationFrame(frame);
    };

    async function settle(end,ballEnd,player,winnerIndex){
      rotation=end;ballRotation=ballEnd;
      wheel.style.transform=`rotate(${end}deg)`;
      orbit.style.transform=`rotate(${ballEnd}deg)`;
      ball.style.transform='translate(-50%,-50%) translateY(0)';
      root.querySelectorAll('.casino-pocket-label').forEach((node,index)=>node.classList.toggle('selected',index===winnerIndex));
      if(!prefersReducedMotion()){
        animateLite(ball,{y:[0,8,1,5,0],scale:[1,1.12,.96,1.05,1],duration:560,ease:'out(3)'});
        const rebound=wheel.animate([
          {transform:`rotate(${end}deg)`},
          {transform:`rotate(${end+2.4}deg)`},
          {transform:`rotate(${end-.8}deg)`},
          {transform:`rotate(${end}deg)`}
        ],{duration:430,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
        try{await rebound.finished}catch{}
      }
      vibrate([35,35,70],ctx.global.haptics);tone(560,.13,ctx.global.sound,.04);
      spinning=false;
      setTimeout(()=>showResult(player),520);
    }

    function showResult(player){
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered casino-result"><span class="eyebrow">小球落定</span><h2>${escapeHtml(player.name)} 遭殃</h2><div class="casino-winner-chip" data-winner>${escapeHtml([...player.name][0])}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-again>再转一次</button></section>`;
      bindExit(root,ctx);
      animateLite(root.querySelector('[data-winner]'),{y:[20,-5,0],scale:[.45,1.12,1],opacity:[0,1,1],duration:650,ease:'out(4)'});
      root.querySelector('[data-punish]').onclick=()=>ctx.punishment([player],{onDone:()=>plugin.mount(root,ctx)});
      root.querySelector('[data-again]').onclick=()=>plugin.mount(root,ctx);
    }
  }
};
registerGame(plugin);
export default plugin;
