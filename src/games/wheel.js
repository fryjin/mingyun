import { registerGame } from './registry.js';
import { escapeHtml, randomInt, tone, vibrate } from '../core/utils.js';
import { bindExit, stageHeader } from './shared.js';

const colors=['#8b5cf6','#ec4899','#06b6d4','#f59e0b','#22c55e','#ef4444','#3b82f6','#a855f7','#14b8a6','#f97316','#84cc16','#e879f9'];

const plugin={
  id:'wheel',title:'命运转盘',sortOrder:4,icon:'wheel',color:'#f472b6',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'30 秒',shortDescription:'转动命运转盘，随机锁定一位玩家。',
  description:'当前在场玩家均分转盘。指针停止后直接锁定本轮遭殃的人。',
  phoneMode:'主持人操作即可',resultMode:'随机锁定一位玩家',defaultSettings:{turns:5,level:'standard'},
  renderSetup(settings){
    return `<div class="setting-block"><div class="setting-label"><span>旋转强度</span><small>动画圈数</small></div><div class="segmented" data-turns><button type="button" data-segment data-value="4" class="${settings.turns===4?'active':''}">轻快</button><button type="button" data-segment data-value="5" class="${settings.turns===5?'active':''}">标准</button><button type="button" data-segment data-value="7" class="${settings.turns===7?'active':''}">戏剧</button></div></div>`;
  },
  readSetup(sheet){
    return {turns:Number(sheet.querySelector('[data-turns] .active')?.dataset.value||5)};
  },
  mount(root,ctx){
    let rotation=0;
    let spinning=false;
    const n=ctx.players.length;
    const step=360/n;
    const gradient=ctx.players.map((_,i)=>`${colors[i%colors.length]} ${i*step}deg ${(i+1)*step}deg`).join(',');
    root.innerHTML=`${stageHeader(plugin.title,`${n} 位在场玩家`)}<section class="game-stage centered"><div class="wheel-wrap"><span class="wheel-pointer"></span><div class="wheel" style="--wheel:${gradient}" data-wheel>${ctx.players.map((p,i)=>`<span class="wheel-label" style="--i:${i};--n:${n}">${escapeHtml(p.name)}</span>`).join('')}</div><div class="wheel-hub">GO</div></div><button class="button primary large" data-spin>转动命运</button></section>`;
    bindExit(root,ctx);
    const wheel=root.querySelector('[data-wheel]');
    const button=root.querySelector('[data-spin]');
    button.onclick=()=>{
      if(spinning)return;
      spinning=true;
      button.disabled=true;
      const winnerIndex=randomInt(0,n-1);
      const targetAngle=360-(winnerIndex*step+step/2);
      const start=rotation;
      const end=start+(ctx.settings.turns||5)*360+targetAngle-(start%360);
      const duration=4200;
      const startAt=performance.now();
      let lastTick=-1;
      const frame=now=>{
        const t=Math.min(1,(now-startAt)/duration);
        const ease=1-Math.pow(1-t,4);
        rotation=start+(end-start)*ease;
        wheel.style.transform=`rotate(${rotation}deg)`;
        const tick=Math.floor(rotation/step);
        if(tick!==lastTick){
          lastTick=tick;
          tone(280,.018,ctx.global.sound,.018);
          vibrate(5,ctx.global.haptics);
        }
        if(t<1)requestAnimationFrame(frame);
        else{
          spinning=false;
          vibrate([35,35,70],ctx.global.haptics);
          showResult(ctx.players[winnerIndex]);
        }
      };
      requestAnimationFrame(frame);
    };
    function showResult(player){
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">指针停下</span><h2>${escapeHtml(player.name)} 遭殃</h2><div class="winner-orb">${escapeHtml([...player.name][0])}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-again>再转一次</button></section>`;
      bindExit(root,ctx);
      root.querySelector('[data-punish]').onclick=()=>ctx.punishment([player],{onDone:()=>plugin.mount(root,ctx)});
      root.querySelector('[data-again]').onclick=()=>plugin.mount(root,ctx);
    }
  }
};
registerGame(plugin);
export default plugin;
