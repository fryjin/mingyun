import { registerGame } from './registry.js';
import { escapeHtml, randomInt, tone, vibrate } from '../core/utils.js';
import { animateLite, prefersReducedMotion } from '../core/motion.js';
import { bindExit, stageHeader } from './shared.js';

const PLAYER_TONES=['#c8a86d','#8b668f','#687caa','#6f8f88','#a26f69','#77718f','#9a855e','#607d85','#8b6f63','#747c9c','#87708a','#65857b'];

function profileProgress(t,acceleration=.17,cruise=.16,deceleration=.67){
  const maxVelocity=1/(acceleration/2+cruise+deceleration/2);
  if(t<acceleration)return .5*(t*t/acceleration)*maxVelocity;
  if(t<acceleration+cruise)return (acceleration/2+(t-acceleration))*maxVelocity;
  const u=t-acceleration-cruise;
  return (acceleration/2+cruise+u-u*u/(2*deceleration))*maxVelocity;
}

function playerNodes(players,step){
  return players.map((player,index)=>{
    const angle=index*step+step/2;
    const counter=-angle;
    const tone=PLAYER_TONES[index%PLAYER_TONES.length];
    const initial=escapeHtml([...player.name][0]||String(index+1));
    return `<span class="fate-player-node" data-player-node="${index}" style="--angle:${angle}deg;--counter-angle:${counter}deg;--player-tone:${tone}"><span class="fate-player-node__inner"><i>${String(index+1).padStart(2,'0')}</i><b>${initial}</b><strong>${escapeHtml(player.name)}</strong></span></span>`;
  }).join('');
}

const plugin={
  id:'wheel',title:'命运转盘',sortOrder:4,icon:'wheel',color:'#d4af61',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'30 秒',shortDescription:'转动命运星盘，随机选出一位玩家。',
  description:'启动命运星盘。固定信标最终指向的玩家接受本轮惩罚。',
  phoneMode:'一人点击即可',resultMode:'星盘随机选人',defaultSettings:{turns:5,level:'standard'},
  renderSetup(settings){
    return `<div class="setting-block"><div class="setting-label"><span>转动节奏</span><small>动画时长</small></div><div class="segmented" data-turns><button type="button" data-segment data-value="4" class="${settings.turns===4?'active':''}">轻快</button><button type="button" data-segment data-value="5" class="${settings.turns===5?'active':''}">标准</button><button type="button" data-segment data-value="7" class="${settings.turns===7?'active':''}">更久</button></div></div>`;
  },
  readSetup(sheet){return {turns:Number(sheet.querySelector('[data-turns] .active')?.dataset.value||5)}},
  mount(root,ctx){
    let rotation=0,innerRotation=0,haloRotation=0,spinning=false,frameId=null;
    const count=ctx.players.length,step=360/count;
    root.innerHTML=`${stageHeader(plugin.title,`${count} 位玩家`)}<section class="game-stage centered fate-wheel-game"><div class="fate-wheel-copy"><span>命运正在等待启动</span><strong>下一位会是谁？</strong></div><div class="fate-wheel-stage" data-assembly aria-label="命运转盘，共 ${count} 位玩家"><span class="fate-beacon" aria-hidden="true"><i></i></span><span class="fate-beacon-glow" aria-hidden="true"></span><div class="fate-halo" data-halo aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="fate-wheel" data-wheel style="--counter-rotation:0deg"><div class="fate-wheel-runes" aria-hidden="true"></div><div class="fate-wheel-lines" aria-hidden="true" style="--step:${step}deg"></div>${playerNodes(ctx.players,step)}<div class="fate-inner-orbit" data-inner aria-hidden="true"><span></span><span></span><span></span></div><div class="fate-core" data-core aria-hidden="true"><i></i><strong>命运</strong><small>FATE</small></div></div></div><p class="fate-wheel-hint">固定信标最终指向的玩家接受本轮惩罚</p><button class="button primary large fate-spin-button" data-spin>启动命运星盘</button><ol class="sr-only">${ctx.players.map(player=>`<li>${escapeHtml(player.name)}</li>`).join('')}</ol></section>`;
    bindExit(root,ctx);
    const wheel=root.querySelector('[data-wheel]');
    const inner=root.querySelector('[data-inner]');
    const halo=root.querySelector('[data-halo]');
    const core=root.querySelector('[data-core]');
    const assembly=root.querySelector('[data-assembly]');
    const button=root.querySelector('[data-spin]');
    ctx.onCleanup(()=>cancelAnimationFrame(frameId));

    const applyTransforms=()=>{
      wheel.style.transform=`rotate(${rotation}deg)`;
      wheel.style.setProperty('--counter-rotation',`${-rotation}deg`);
      inner.style.transform=`translate(-50%,-50%) rotate(${innerRotation}deg)`;
      halo.style.transform=`translate(-50%,-50%) rotate(${haloRotation}deg)`;
    };

    button.onclick=()=>{
      if(spinning)return;
      spinning=true;button.disabled=true;button.textContent='命运转动中…';
      assembly.classList.add('is-spinning');
      root.querySelectorAll('[data-player-node]').forEach(node=>node.classList.remove('selected','nearby'));
      const winnerIndex=randomInt(0,count-1),turns=ctx.settings.turns||5;
      const start=rotation;
      const startNormalized=((start%360)+360)%360;
      const centerAngle=winnerIndex*step+step/2;
      const targetNormalized=(360-centerAngle)%360;
      const delta=(targetNormalized-startNormalized+360)%360;
      const end=start+turns*360+delta;
      const innerStart=innerRotation,innerEnd=innerStart-(turns+1.7)*360;
      const haloStart=haloRotation,haloEnd=haloStart+(turns*.72+1.15)*360;
      const duration=prefersReducedMotion()?100:3900+turns*210;
      const started=performance.now();
      let lastTick=Math.floor(start/step);
      animateLite(assembly,{scale:[1,.985,1.018,1],duration:680,ease:'out(3)'});
      animateLite(core,{scale:[1,.9,1.08,1],opacity:[1,.82,1,1],duration:760,ease:'out(4)'});

      const frame=now=>{
        const t=Math.min(1,(now-started)/duration);
        const mainProgress=profileProgress(t,.17,.16,.67);
        const innerProgress=profileProgress(t,.12,.15,.73);
        const haloProgress=profileProgress(t,.2,.18,.62);
        rotation=start+(end-start)*mainProgress;
        innerRotation=innerStart+(innerEnd-innerStart)*innerProgress;
        haloRotation=haloStart+(haloEnd-haloStart)*haloProgress;
        applyTransforms();
        const tick=Math.floor(rotation/step);
        if(tick!==lastTick){
          lastTick=tick;
          tone(190+Math.max(0,1-t)*150,.018,ctx.global.sound,.012);
          vibrate(t>.72?5:3,ctx.global.haptics);
        }
        if(t<1)frameId=requestAnimationFrame(frame);
        else settle(end,innerEnd,haloEnd,winnerIndex);
      };
      frameId=requestAnimationFrame(frame);
    };

    async function settle(end,innerEnd,haloEnd,winnerIndex){
      rotation=end;innerRotation=innerEnd;haloRotation=haloEnd;applyTransforms();
      assembly.classList.remove('is-spinning');
      assembly.classList.add('is-settled');
      const nodes=[...root.querySelectorAll('[data-player-node]')];
      nodes.forEach((node,index)=>{
        node.classList.toggle('selected',index===winnerIndex);
        node.classList.toggle('nearby',index===(winnerIndex-1+count)%count||index===(winnerIndex+1)%count);
      });
      if(!prefersReducedMotion()){
        const rebound=wheel.animate([
          {transform:`rotate(${end}deg)`},
          {transform:`rotate(${end+2.1}deg)`},
          {transform:`rotate(${end-.65}deg)`},
          {transform:`rotate(${end}deg)`}
        ],{duration:500,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
        animateLite(core,{scale:[1,1.16,.96,1.06,1],duration:720,ease:'out(4)'});
        try{await rebound.finished}catch{}
      }
      vibrate([32,30,72],ctx.global.haptics);tone(540,.14,ctx.global.sound,.04);
      spinning=false;
      setTimeout(()=>showResult(ctx.players[winnerIndex]),620);
    }

    function showResult(player){
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered fate-result"><span class="eyebrow">命运已锁定</span><h2>${escapeHtml(player.name)} 遭殃</h2><div class="fate-result-sigil" data-winner aria-hidden="true"><span>${escapeHtml([...player.name][0]||'命')}</span><i></i></div><p>本轮由命运星盘选中</p><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-again>再转一次</button></section>`;
      bindExit(root,ctx);
      animateLite(root.querySelector('[data-winner]'),{y:[18,-4,0],scale:[.55,1.1,1],opacity:[0,1,1],duration:680,ease:'out(4)'});
      root.querySelector('[data-punish]').onclick=()=>ctx.punishment([player],{onDone:()=>plugin.mount(root,ctx)});
      root.querySelector('[data-again]').onclick=()=>plugin.mount(root,ctx);
    }
  }
};
registerGame(plugin);
export default plugin;
