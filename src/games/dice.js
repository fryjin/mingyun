import { registerGame } from './registry.js';
import { randomInt, escapeHtml, tone, vibrate, wait } from '../core/utils.js';
import { animateLite, prefersReducedMotion } from '../core/motion.js';
import { bindExit, stageHeader } from './shared.js';

const finalRotation={
  1:'rotateX(-8deg) rotateY(8deg)',
  2:'rotateX(-8deg) rotateY(-82deg)',
  3:'rotateX(-8deg) rotateY(172deg)',
  4:'rotateX(-8deg) rotateY(88deg)',
  5:'rotateX(-98deg) rotateY(0deg)',
  6:'rotateX(82deg) rotateY(0deg)'
};
const dots=number=>`<span class="dot dot-${number}"></span>`;
const dieMarkup=()=>`<div class="dice-scene" data-dice-scene><div class="dice-shadow" data-dice-shadow></div><div class="dice-cube" data-dice-cube aria-label="骰子"><div class="dice-side front">${dots(5)}</div><div class="dice-side back">${dots(1)}${dots(5)}${dots(9)}</div><div class="dice-side right">${dots(1)}${dots(9)}</div><div class="dice-side left">${dots(1)}${dots(3)}${dots(5)}${dots(7)}</div><div class="dice-side top">${dots(1)}${dots(3)}${dots(5)}${dots(7)}${dots(9)}</div><div class="dice-side bottom">${dots(1)}${dots(3)}${dots(4)}${dots(6)}${dots(7)}${dots(9)}</div></div></div>`;

const plugin={
  id:'dice',title:'命运骰局',sortOrder:3,icon:'dice',color:'#a78bfa',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'1–3 分钟',shortDescription:'轮流投骰，点数决定谁遭殃。',
  description:'每个人投一次骰子。全部投完后，按最高点或最低点选出本轮输家。',
  phoneMode:'依次传递手机',resultMode:'点数决定惩罚玩家',defaultSettings:{loserRule:'high',level:'standard'},
  renderSetup(settings){return `<div class="setting-block"><div class="setting-label"><span>谁接受惩罚</span><small>本轮判定</small></div><div class="segmented" data-rule><button type="button" data-segment data-value="high" class="${settings.loserRule==='high'?'active':''}">最高点</button><button type="button" data-segment data-value="low" class="${settings.loserRule==='low'?'active':''}">最低点</button></div></div>`},
  readSetup(sheet){return {loserRule:sheet.querySelector('[data-rule] .active')?.dataset.value||'high'}},
  mount(root,ctx){
    let index=0,rolls=[];
    const render=()=>{
      const player=ctx.players[index];
      root.innerHTML=`${stageHeader(plugin.title,`${ctx.settings.loserRule==='high'?'最高点':'最低点'}接受惩罚`)}<section class="game-stage centered dice-game"><div class="turn-progress">第 ${Math.min(index+1,ctx.players.length)} / ${ctx.players.length} 位</div><span class="current-player">${escapeHtml(player?.name||'本轮完成')}</span>${dieMarkup()}<button class="button primary large" data-roll ${!player?'disabled':''}>轻触投骰</button>${rolls.length?`<div class="score-strip">${rolls.map(roll=>`<span>${escapeHtml(roll.player.name)} <b>${roll.value}</b></span>`).join('')}</div>`:''}</section>`;
      bindExit(root,ctx);root.querySelector('[data-roll]')?.addEventListener('click',roll);
    };
    const roll=async()=>{
      const button=root.querySelector('[data-roll]'),cube=root.querySelector('[data-dice-cube]'),scene=root.querySelector('[data-dice-scene]'),shadow=root.querySelector('[data-dice-shadow]');
      button.disabled=true;button.textContent='命运滚动中…';
      const value=randomInt(1,6),duration=prefersReducedMotion()?60:920;
      let tick=0;const tickTimer=setInterval(()=>{tone(170+tick%5*34,.025,ctx.global.sound,.014);tick++},95);
      animateLite(scene,{y:[0,-18,0],scale:[1,1.045,1],duration,ease:'out(3)'});
      animateLite(shadow,{scale:[1,.72,1],opacity:[.42,.2,.42],duration,ease:'out(3)'});
      if(prefersReducedMotion())cube.style.transform=finalRotation[value];
      else{
        const end=finalRotation[value];
        const animation=cube.animate([
          {transform:'rotateX(-20deg) rotateY(28deg) rotateZ(0deg)',offset:0},
          {transform:'rotateX(280deg) rotateY(390deg) rotateZ(60deg)',offset:.38},
          {transform:'rotateX(590deg) rotateY(750deg) rotateZ(105deg)',offset:.76},
          {transform:end,offset:1}
        ],{duration,easing:'cubic-bezier(.18,.72,.2,1)',fill:'forwards'});
        try{await animation.finished}catch{}
      }
      clearInterval(tickTimer);cube.style.transform=finalRotation[value];
      tone(430,.08,ctx.global.sound,.035);vibrate([22,28,46],ctx.global.haptics);
      rolls.push({player:ctx.players[index],value});index++;
      await wait(360);
      index>=ctx.players.length?finish():render();
    };
    const finish=()=>{
      const target=ctx.settings.loserRule==='high'?Math.max(...rolls.map(roll=>roll.value)):Math.min(...rolls.map(roll=>roll.value));
      const tied=rolls.filter(roll=>roll.value===target);const loser=tied[randomInt(0,tied.length-1)].player;
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">本轮结果</span><h2>${escapeHtml(loser.name)} 遭殃</h2><div class="result-number" data-result>${target}</div>${tied.length>1?'<p>同点玩家中随机选出一位。</p>':''}<button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-next>再来一轮</button></section>`;
      bindExit(root,ctx);animateLite(root.querySelector('[data-result]'),{y:[18,-4,0],scale:[.7,1.12,1],opacity:[0,1,1],duration:620,ease:'out(4)'});
      root.querySelector('[data-punish]').onclick=()=>ctx.punishment([loser],{onDone:reset});root.querySelector('[data-next]').onclick=reset;
    };
    const reset=()=>{index=0;rolls=[];render()};
    render();
  }
};
registerGame(plugin);
export default plugin;
