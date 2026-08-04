import { registerGame } from './registry.js';
import { escapeHtml, shuffle, tone, vibrate, wait } from '../core/utils.js';
import { bindExit, stageHeader } from './shared.js';

const LEVELS={
  1:{doors:4,safe:3},
  2:{doors:5,safe:3},
  3:{doors:4,safe:2},
  4:{doors:5,safe:2},
  5:{doors:4,safe:1}
};
const RUNES=['✦','◇','☾','✧','◈'];

const plugin={
  id:'fate-ladder',title:'命运阶梯',sortOrder:2.3,icon:'ladder',color:'#8c7db2',minPlayers:2,maxPlayers:12,supportsAdult:true,
  estimatedTime:'5–12 分钟',shortDescription:'继续攀登或及时收手，坠落则成绩归零。',
  description:'每位玩家依次挑战五层命运阶梯。通过一层后可继续攀登或锁定成绩；任意层坠落，本次成绩归零。',
  phoneMode:'玩家依次挑战',resultMode:'最低成绩玩家受罚',defaultSettings:{level:'standard'},
  renderSetup(){return '<div class="info-strip"><strong>纯命运挑战</strong><span>下方尺度仅用于最终惩罚</span></div>'},
  mount(root,ctx){
    let playerIndex=0;
    let currentLevel=1;
    let currentScore=0;
    let scores=new Map();
    let doors=[];
    let suddenCandidates=[];
    let suddenIndex=0;
    let suddenFailed=[];
    let suddenRound=0;
    let suddenMode=false;

    const currentPlayer=()=>suddenMode?suddenCandidates[suddenIndex]:ctx.players[playerIndex];

    const reset=()=>{
      playerIndex=0;currentLevel=1;currentScore=0;scores=new Map(ctx.players.map(player=>[player.id,0]));suddenCandidates=[];suddenIndex=0;suddenFailed=[];suddenRound=0;suddenMode=false;renderPlayerStart();
    };

    const ladderHtml=(activeLevel=currentLevel)=>`<div class="ladder-track">${[5,4,3,2,1].map(level=>`<div class="ladder-step ${level<activeLevel?'passed':level===activeLevel?'active':''}"><span>${level}</span><i></i><b>${level===5?'命运核心':`第 ${level} 层`}</b></div>`).join('')}</div>`;

    const scoreStrip=()=>`<div class="ladder-score-strip">${ctx.players.map(player=>`<span><b>${escapeHtml(player.name)}</b><i>${scores.get(player.id)||0}</i></span>`).join('')}</div>`;

    const renderPlayerStart=()=>{
      const player=currentPlayer();
      root.innerHTML=`${stageHeader(plugin.title,`第 ${playerIndex+1} / ${ctx.players.length} 位挑战者`)}<section class="game-stage ladder-stage"><div class="ladder-player-head"><span class="eyebrow">当前挑战者</span><h2>${escapeHtml(player.name)}</h2><p>通过后可以继续攀登，也可以锁定当前成绩。</p></div>${ladderHtml(1)}${scoreStrip()}<button class="button primary full" data-start-climb>开始攀登</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-start-climb]').onclick=()=>{currentLevel=1;currentScore=0;prepareLevel()};
    };

    const prepareLevel=()=>{
      const config=LEVELS[currentLevel];
      doors=shuffle([...Array(config.safe).fill(true),...Array(config.doors-config.safe).fill(false)]);
      renderLevel();
    };

    const renderLevel=()=>{
      const config=LEVELS[currentLevel];
      root.innerHTML=`${stageHeader(plugin.title,`${escapeHtml(currentPlayer().name)} · 第 ${currentLevel} 层`)}<section class="game-stage ladder-stage"><div class="ladder-player-head"><span class="eyebrow">选择一个命运符号</span><h2>第 ${currentLevel} 层</h2><p>${config.safe} 个安全符号，${config.doors-config.safe} 个坠落符号。所有符号外观完全相同。</p></div>${ladderHtml(currentLevel)}<div class="ladder-runes count-${doors.length}">${doors.map((_,index)=>`<button type="button" data-door="${index}" aria-label="命运符号 ${index+1}"><span>${RUNES[currentLevel%RUNES.length]}</span></button>`).join('')}</div><div class="ladder-current-score">当前可锁定 <strong>${currentScore}</strong> 分</div></section>`;
      bindExit(root,ctx);root.querySelectorAll('[data-door]').forEach(button=>button.onclick=()=>selectDoor(Number(button.dataset.door)));
    };

    const selectDoor=async index=>{
      const safe=doors[index];
      root.querySelectorAll('[data-door]').forEach((button,buttonIndex)=>{button.disabled=true;if(buttonIndex===index)button.classList.add(safe?'safe':'fall')});
      tone(safe ? 520 : 150, safe ? .09 : .18, ctx.global.sound, safe ? .04 : .055);vibrate(safe?[22,30,22]:[70,40,90],ctx.global.haptics);
      await wait(safe?520:760);
      safe?renderSuccess():renderFall();
    };

    const renderSuccess=()=>{
      currentScore=currentLevel;
      if(currentLevel===5){
        root.innerHTML=`${stageHeader(plugin.title,'成功登顶')}<section class="game-stage centered ladder-outcome success"><div class="ladder-core">✦</div><span class="eyebrow">命运核心点亮</span><h2>${escapeHtml(currentPlayer().name)} 获得 5 分</h2><button class="button primary full" data-finish-player>锁定登顶成绩</button></section>`;
        bindExit(root,ctx);root.querySelector('[data-finish-player]').onclick=()=>finishCurrent(5);return;
      }
      root.innerHTML=`${stageHeader(plugin.title,`通过第 ${currentLevel} 层`)}<section class="game-stage ladder-outcome success"><div class="ladder-success-mark">↑</div><span class="eyebrow">阶梯已点亮</span><h2>当前成绩 ${currentScore} 分</h2>${ladderHtml(currentLevel+1)}<div class="dual-actions"><button class="button secondary full" data-lock>收手并锁定</button><button class="button primary full" data-continue>继续攀登</button></div></section>`;
      bindExit(root,ctx);root.querySelector('[data-lock]').onclick=()=>finishCurrent(currentScore);root.querySelector('[data-continue]').onclick=()=>{currentLevel++;prepareLevel()};
    };

    const renderFall=()=>{
      root.innerHTML=`${stageHeader(plugin.title,`第 ${currentLevel} 层坠落`)}<section class="game-stage centered ladder-outcome fall"><div class="ladder-fall-mark">◆</div><span class="eyebrow">命运熄灭</span><h2>${escapeHtml(currentPlayer().name)} 本次 0 分</h2><p>此前通过的层级不会保留。</p><button class="button primary full" data-finish-player>结束本次挑战</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-finish-player]').onclick=()=>finishCurrent(0);
    };

    const finishCurrent=score=>{
      scores.set(currentPlayer().id,score);playerIndex++;
      if(playerIndex>=ctx.players.length)settleScores();else{currentLevel=1;currentScore=0;renderPlayerStart()}
    };

    const settleScores=()=>{
      const minimum=Math.min(...ctx.players.map(player=>scores.get(player.id)||0));
      const tied=ctx.players.filter(player=>(scores.get(player.id)||0)===minimum);
      if(tied.length===1){renderFinal(tied[0],false);return}
      suddenMode=true;suddenCandidates=tied;suddenIndex=0;suddenFailed=[];suddenRound=1;renderSuddenStart();
    };

    const renderSuddenStart=()=>{
      const player=currentPlayer();
      root.innerHTML=`${stageHeader(plugin.title,`突然死亡 · 第 ${suddenRound} 轮`)}<section class="game-stage centered ladder-sudden"><span class="eyebrow">最低分并列</span><h2>${escapeHtml(player.name)} 挑战第 1 层</h2><p>本轮只有第一层。失败者继续留在最低分候选中。</p><button class="button primary full" data-sudden-start>开始选择</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-sudden-start]').onclick=prepareSuddenLevel;
    };

    const prepareSuddenLevel=()=>{
      doors=shuffle([true,true,true,false]);
      root.innerHTML=`${stageHeader(plugin.title,`突然死亡 · ${suddenIndex+1} / ${suddenCandidates.length}`)}<section class="game-stage centered ladder-sudden"><span class="eyebrow">${escapeHtml(currentPlayer().name)}</span><h2>选择一个命运符号</h2><div class="ladder-runes sudden count-${doors.length}">${doors.map((_,index)=>`<button type="button" data-sudden-door="${index}"><span>✦</span></button>`).join('')}</div></section>`;
      bindExit(root,ctx);root.querySelectorAll('[data-sudden-door]').forEach(button=>button.onclick=()=>resolveSudden(Number(button.dataset.suddenDoor)));
    };

    const resolveSudden=async index=>{
      const safe=doors[index];root.querySelectorAll('[data-sudden-door]').forEach((button,buttonIndex)=>{button.disabled=true;if(buttonIndex===index)button.classList.add(safe?'safe':'fall')});
      tone(safe ? 500 : 145, safe ? .08 : .16, ctx.global.sound, .04);vibrate(safe?[20,25,20]:[70,35,80],ctx.global.haptics);
      if(!safe)suddenFailed.push(currentPlayer());
      await wait(560);suddenIndex++;
      if(suddenIndex<suddenCandidates.length){renderSuddenStart();return}
      if(suddenFailed.length===1){renderFinal(suddenFailed[0],true);return}
      suddenCandidates=suddenFailed.length?suddenFailed:[...suddenCandidates];suddenFailed=[];suddenIndex=0;suddenRound++;renderSuddenStart();
    };

    const renderFinal=(loser,sudden)=>{
      const ordered=[...ctx.players].sort((a,b)=>(scores.get(b.id)||0)-(scores.get(a.id)||0));
      root.innerHTML=`${stageHeader(plugin.title,'最终成绩')}<section class="game-stage centered ladder-final"><span class="eyebrow">最低成绩</span><h2>${escapeHtml(loser.name)} 遭殃</h2>${sudden?'<p>最低分并列后，通过突然死亡产生唯一受罚者。</p>':''}<div class="ladder-final-scores">${ordered.map(player=>`<div class="${player.id===loser.id?'loser':''}"><span>${escapeHtml(player.name)}</span><strong>${scores.get(player.id)||0} 分</strong></div>`).join('')}</div><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-restart>再来一局</button></section>`;
      bindExit(root,ctx);root.querySelector('[data-punish]').onclick=()=>ctx.punishment([loser],{onDone:reset});root.querySelector('[data-restart]').onclick=reset;
    };

    reset();
  }
};
registerGame(plugin);
export default plugin;
