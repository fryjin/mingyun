import { registerGame } from './registry.js';
import { adultPlusFilterKey, allowedByAdultPlus, drawGame } from '../modules/questions.js';
import { escapeHtml, randomInt } from '../core/utils.js';
import { bindExit, stageHeader } from './shared.js';

const typeLabels={instant:'即时任务',persistent:'持续法则',global:'全场事件',privilege:'特殊权利',direction:'顺序变化'};

function requirementTags(item){
  const requirements=item?.requirements||{};const tags=[];
  if(requirements.kissing)tags.push('亲吻互动');
  else if(requirements.contact)tags.push(Number(requirements.contactLevel||1)>=2?'亲密接触':'轻接触');
  if(requirements.alcohol)tags.push('酒水可选');
  if(requirements.pairConsent)tags.push('逐题同意');
  return tags;
}

const plugin={
  id:'chaos-rules',title:'混乱法则',sortOrder:2.1,icon:'chaos',color:'#b2788e',minPlayers:3,maxPlayers:12,supportsAdult:true,
  estimatedTime:'10–25 分钟',shortDescription:'法则持续叠加，先失误到上限的人遭殃。',
  description:'轮流抽取即时任务、持续法则、全场事件、特殊权利或顺序变化。持续法则会叠加生效，首位达到失误上限的玩家接受惩罚。',
  phoneMode:'按当前方向轮流共用',resultMode:'首位达到失误上限者受罚',defaultSettings:{mistakeLimit:3,level:'standard'},
  renderSetup(settings){return `<div class="setting-block"><div class="setting-label"><span>失误上限</span><small>达到后立即结算</small></div><div class="segmented" data-limit>${[2,3,5].map(value=>`<button type="button" data-segment data-value="${value}" class="${Number(settings.mistakeLimit||3)===value?'active':''}">${value} 次</button>`).join('')}</div></div>`},
  readSetup(sheet){return {mistakeLimit:Number(sheet.querySelector('[data-limit] .active')?.dataset.value||3)}},
  async mount(root,ctx){
    const limit=[2,3,5].includes(Number(ctx.settings.mistakeLimit))?Number(ctx.settings.mistakeLimit):3;
    let currentIndex=0;
    let direction=1;
    let turn=1;
    let mistakes=new Map(ctx.players.map(player=>[player.id,0]));
    let shields=new Map(ctx.players.map(player=>[player.id,0]));
    let activeRules=[];
    let skipNext=0;
    let repeatCurrent=false;
    let forcedNextId=null;
    let currentItem=null;
    let currentOverride='';
    let loading=false;

    const currentPlayer=()=>ctx.players[currentIndex];
    const directionLabel=()=>direction===1?'顺时针':'逆时针';
    const scoreDots=count=>Array.from({length:limit},(_,index)=>`<i class="${index<count?'filled':''}"></i>`).join('');

    const statusHtml=()=>`<section class="chaos-status"><div><span>当前方向</span><strong>${directionLabel()}</strong></div><div><span>当前回合</span><strong>${turn}</strong></div><div><span>持续法则</span><strong>${activeRules.length} / 3</strong></div></section>
      <div class="chaos-scoreboard">${ctx.players.map(player=>`<div><span>${escapeHtml(player.name)}</span><span class="chaos-mistakes">${scoreDots(mistakes.get(player.id)||0)}</span>${(shields.get(player.id)||0)>0?`<b>护盾×${shields.get(player.id)}</b>`:''}</div>`).join('')}</div>`;

    const activeRulesHtml=()=>activeRules.length?`<section class="chaos-active-rules"><header><strong>当前生效法则</strong><span>冲突时以最新法则为准</span></header>${[...activeRules].reverse().map(rule=>`<article><div><span>剩余 ${rule.remaining} 回合</span><strong>${escapeHtml(rule.instruction)}</strong></div><button type="button" data-violate="${rule.id}">记录违反</button></article>`).join('')}</section>`:`<section class="chaos-active-rules empty"><p>当前没有持续法则。</p></section>`;

    const bindCommon=()=>{
      bindExit(root,ctx);
      root.querySelectorAll('[data-violate]').forEach(button=>button.onclick=()=>renderViolation(button.dataset.violate));
    };

    const renderTurn=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`${directionLabel()} · 失误上限 ${limit}`)}<section class="game-stage chaos-stage">${statusHtml()}${activeRulesHtml()}<div class="chaos-turn-card"><span class="eyebrow">当前玩家</span><h2>${escapeHtml(currentPlayer().name)}</h2><p>抽取一条新的法则或事件。持续法则在后续回合继续生效。</p><button class="button primary full" data-draw>抽取混乱法则</button></div></section>`;
      bindCommon();root.querySelector('[data-draw]').onclick=drawRule;
    };

    const drawRule=async()=>{
      if(loading)return;loading=true;
      root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><div class="loading-state">正在扰动规则…</div></section>`;bindExit(root,ctx);
      try{
        const prefs=ctx.settings.adultPlus||{};
        const predicate=ctx.settings.level==='adult-plus'?item=>allowedByAdultPlus(item,prefs):()=>true;
        const key=ctx.settings.level==='adult-plus'?adultPlusFilterKey(prefs):'all';
        currentItem=await drawGame(plugin.id,ctx.settings.level,predicate,key);currentOverride='';renderRule(false);
      }catch(error){root.innerHTML=`${stageHeader(plugin.title)}<section class="game-stage centered"><h2>法则加载失败</h2><p>${escapeHtml(error.message)}</p><button class="button secondary full" data-back>返回大厅</button></section>`;bindExit(root,ctx);root.querySelector('[data-back]').onclick=ctx.goLobby}
      finally{loading=false}
    };

    const renderRule=(accepted=false)=>{
      const item=currentItem;const tags=requirementTags(item);const needsGate=!accepted&&item.consentRequired&&tags.length;
      const instruction=currentOverride||item.instruction;
      const typeHint=item.type==='persistent'?`持续 ${Number(item.duration||3)} 回合`:item.type==='privilege'?'获得一次性权利':item.type==='direction'?'立即改变回合顺序':'本回合立即处理';
      root.innerHTML=`${stageHeader(plugin.title,`${escapeHtml(currentPlayer().name)} 的回合`)}<section class="game-stage chaos-rule-stage ${item.type}">${statusHtml()}<div class="chaos-rule-card"><span class="chaos-type">${typeLabels[item.type]||'混乱法则'}</span><small>${escapeHtml(typeHint)}</small>${tags.length?`<div class="requirement-tags">${tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div>`:''}<h2>${escapeHtml(instruction)}</h2>${needsGate?'<section class="consent-gate"><strong>逐题确认</strong><p>所有相关玩家明确同意后再继续。拒绝、替代或换题不会追加失误。</p></section>':''}${actionButtons(item,needsGate)}</div><button class="button ghost full" data-change>换一条法则</button></section>`;
      bindExit(root,ctx);
      root.querySelector('[data-change]').onclick=drawRule;
      root.querySelector('[data-agree]')?.addEventListener('click',()=>renderRule(true));
      root.querySelector('[data-alt]')?.addEventListener('click',()=>{currentOverride=item.alternatives?.[0]||item.instruction;renderRule(true)});
      root.querySelector('[data-success]')?.addEventListener('click',()=>completeItem(true));
      root.querySelector('[data-fail]')?.addEventListener('click',()=>completeItem(false));
      root.querySelector('[data-global-fail]')?.addEventListener('click',renderGlobalFailure);
      root.querySelector('[data-activate]')?.addEventListener('click',()=>completeItem(true));
    };

    const actionButtons=(item,needsGate)=>{
      if(needsGate)return `<div class="dual-actions"><button class="button primary full" data-agree>相关玩家都同意</button>${item.alternatives?.length?'<button class="button secondary full" data-alt>使用替代方案</button>':''}</div>`;
      if(item.type==='instant')return '<div class="dual-actions"><button class="button secondary full" data-fail>未完成</button><button class="button primary full" data-success>已完成</button></div>';
      if(item.type==='global')return '<div class="dual-actions"><button class="button secondary full" data-global-fail>记录未完成人员</button><button class="button primary full" data-success>全员完成</button></div>';
      return '<button class="button primary full" data-activate>确认并生效</button>';
    };

    const completeItem=success=>{
      if(currentItem.type==='instant'&&!success){
        if(recordMistakes([currentPlayer()]))return;
        renderTurnResult(`${currentPlayer().name} 增加一次失误`);return;
      }
      if(currentItem.type==='persistent')addPersistentRule(currentItem,currentOverride||currentItem.instruction);
      if(currentItem.type==='privilege'){if(applyPrivilege(currentItem))return}
      if(currentItem.type==='direction'){if(applyDirection(currentItem))return}
      renderTurnResult(currentItem.type==='global'?'全员完成本次事件':'法则已生效');
    };

    const addPersistentRule=(item,instruction)=>{
      if(activeRules.length>=3)activeRules.shift();
      activeRules.push({id:`rule-${Date.now()}-${randomInt(100,999)}`,instruction,remaining:Number(item.duration||3),fresh:true});
    };

    const applyPrivilege=item=>{
      const effect=item.effect||'shield';const player=currentPlayer();
      if(effect==='shield'){shields.set(player.id,(shields.get(player.id)||0)+1);return false}
      if(effect==='clear-mistake'){mistakes.set(player.id,Math.max(0,(mistakes.get(player.id)||0)-1));return false}
      if(effect==='cancel-rule'&&activeRules.length){renderCancelRule();return true}
      if(effect==='choose-next'){renderChooseNext('privilege');return true}
      shields.set(player.id,(shields.get(player.id)||0)+1);return false;
    };

    const applyDirection=item=>{
      const effect=item.effect||'reverse';
      if(effect==='reverse')direction*=-1;
      if(effect==='skip')skipNext=1;
      if(effect==='repeat')repeatCurrent=true;
      if(effect==='choose-next'){renderChooseNext('direction');return true}
      return false;
    };

    const renderCancelRule=()=>{
      root.innerHTML=`${stageHeader(plugin.title,'使用特殊权利')}<section class="game-stage chaos-select-stage"><span class="eyebrow">取消一条持续法则</span><h2>${escapeHtml(currentPlayer().name)} 请选择</h2><div class="chaos-select-list">${activeRules.map(rule=>`<button type="button" data-cancel-rule="${rule.id}"><span>剩余 ${rule.remaining} 回合</span><strong>${escapeHtml(rule.instruction)}</strong></button>`).join('')}</div></section>`;
      bindExit(root,ctx);root.querySelectorAll('[data-cancel-rule]').forEach(button=>button.onclick=()=>{activeRules=activeRules.filter(rule=>rule.id!==button.dataset.cancelRule);renderTurnResult('持续法则已取消')});
    };

    const renderChooseNext=source=>{
      const available=ctx.players.filter(player=>player.id!==currentPlayer().id);
      root.innerHTML=`${stageHeader(plugin.title,'指定下一位玩家')}<section class="game-stage chaos-select-stage"><span class="eyebrow">${source==='privilege'?'特殊权利':'顺序变化'}</span><h2>谁成为下一位？</h2><div class="player-choice-grid">${available.map(player=>`<button type="button" data-next-player="${player.id}">${escapeHtml(player.name)}</button>`).join('')}</div></section>`;
      bindExit(root,ctx);root.querySelectorAll('[data-next-player]').forEach(button=>button.onclick=()=>{forcedNextId=button.dataset.nextPlayer;renderTurnResult('下一位玩家已指定')});
    };

    const renderGlobalFailure=()=>{
      let selected=new Set();
      root.innerHTML=`${stageHeader(plugin.title,'记录全场事件结果')}<section class="game-stage chaos-select-stage"><span class="eyebrow">选择未完成的玩家</span><h2>${escapeHtml(currentItem.instruction)}</h2><div class="player-choice-grid">${ctx.players.map(player=>`<button type="button" data-failed-player="${player.id}" aria-pressed="false">${escapeHtml(player.name)}</button>`).join('')}</div><button class="button danger full" data-confirm-failed disabled>确认增加失误</button><button class="button ghost full" data-back-rule>返回</button></section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-failed-player]').forEach(button=>button.onclick=()=>{const id=button.dataset.failedPlayer;selected.has(id)?selected.delete(id):selected.add(id);button.classList.toggle('active',selected.has(id));button.setAttribute('aria-pressed',String(selected.has(id)));root.querySelector('[data-confirm-failed]').disabled=!selected.size});
      root.querySelector('[data-back-rule]').onclick=()=>renderRule(true);
      root.querySelector('[data-confirm-failed]').onclick=()=>{
        const players=ctx.players.filter(player=>selected.has(player.id));
        if(recordMistakes(players))return;
        renderTurnResult(`${players.map(player=>player.name).join('、')} 增加失误`);
      };
    };

    const renderViolation=ruleId=>{
      const rule=activeRules.find(item=>item.id===ruleId);if(!rule){renderTurn();return}
      let selected=new Set();
      root.innerHTML=`${stageHeader(plugin.title,'记录法则违反')}<section class="game-stage chaos-select-stage"><span class="eyebrow">持续法则</span><h2>${escapeHtml(rule.instruction)}</h2><p>选择本次违反法则的玩家，可多选。</p><div class="player-choice-grid">${ctx.players.map(player=>`<button type="button" data-violator="${player.id}" aria-pressed="false">${escapeHtml(player.name)}</button>`).join('')}</div><button class="button danger full" data-confirm-violation disabled>确认记录</button><button class="button ghost full" data-cancel-violation>取消</button></section>`;
      bindExit(root,ctx);
      root.querySelectorAll('[data-violator]').forEach(button=>button.onclick=()=>{const id=button.dataset.violator;selected.has(id)?selected.delete(id):selected.add(id);button.classList.toggle('active',selected.has(id));button.setAttribute('aria-pressed',String(selected.has(id)));root.querySelector('[data-confirm-violation]').disabled=!selected.size});
      root.querySelector('[data-cancel-violation]').onclick=renderTurn;
      root.querySelector('[data-confirm-violation]').onclick=()=>{const players=ctx.players.filter(player=>selected.has(player.id));if(recordMistakes(players))return;renderTurn()};
    };

    const recordMistakes=players=>{
      const reached=[];
      players.forEach(player=>{
        const shield=shields.get(player.id)||0;
        if(shield>0){shields.set(player.id,shield-1);return}
        const next=(mistakes.get(player.id)||0)+1;mistakes.set(player.id,next);if(next>=limit)reached.push(player);
      });
      if(reached.length){finish(reached[randomInt(0,reached.length-1)],reached.length>1);return true}
      return false;
    };

    const renderTurnResult=message=>{
      root.innerHTML=`${stageHeader(plugin.title,'回合完成')}<section class="game-stage centered chaos-turn-result"><span class="eyebrow">规则已更新</span><h2>${escapeHtml(message)}</h2>${activeRulesHtml()}<button class="button primary full" data-next-turn>进入下一回合</button></section>`;
      bindCommon();root.querySelector('[data-next-turn]').onclick=advanceTurn;
    };

    const advanceTurn=()=>{
      activeRules=activeRules.map(rule=>rule.fresh?{...rule,fresh:false}:{...rule,remaining:rule.remaining-1}).filter(rule=>rule.remaining>0);
      if(repeatCurrent){repeatCurrent=false}
      else if(forcedNextId){const target=ctx.players.findIndex(player=>player.id===forcedNextId);if(target>=0)currentIndex=target;forcedNextId=null}
      else{const step=1+skipNext;skipNext=0;currentIndex=(currentIndex+direction*step)%ctx.players.length;if(currentIndex<0)currentIndex+=ctx.players.length}
      turn++;currentItem=null;currentOverride='';renderTurn();
    };

    const finish=(loser,randomized=false)=>{
      root.innerHTML=`${stageHeader(plugin.title,'本局结束')}<section class="game-stage centered chaos-finish"><span class="eyebrow">失误达到上限</span><h2>${escapeHtml(loser.name)} 遭殃</h2>${randomized?'<p>多人同时达到上限，系统随机选出一位。</p>':''}<div class="chaos-scoreboard final">${ctx.players.map(player=>`<div class="${player.id===loser.id?'loser':''}"><span>${escapeHtml(player.name)}</span><strong>${mistakes.get(player.id)||0} 次失误</strong></div>`).join('')}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-restart>再来一局</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-punish]').onclick=()=>ctx.punishment([loser],{onDone:reset});root.querySelector('[data-restart]').onclick=reset;
    };

    const reset=()=>{
      currentIndex=0;direction=1;turn=1;mistakes=new Map(ctx.players.map(player=>[player.id,0]));shields=new Map(ctx.players.map(player=>[player.id,0]));activeRules=[];skipNext=0;repeatCurrent=false;forcedNextId=null;currentItem=null;currentOverride='';renderTurn();
    };

    renderTurn();
  }
};
registerGame(plugin);
export default plugin;
