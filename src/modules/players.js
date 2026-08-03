import { getState, resizePlayers, setPlayers, setRoute } from '../core/store.js';
import { escapeHtml, initials, uid } from '../core/utils.js';
import { toast } from './overlay.js';
const randomPool=['雪糕','阿蓝','柚子','丸子','Nova','豆包','鹿鸣','Kiki','山茶','海盐','阿满','十九'];
export function renderPlayers(root){
  const state=getState();
  root.innerHTML=`<section class="page-head"><button class="icon-button" data-back aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><div><span class="eyebrow">Midnight Game Hall</span><h1>玩家管理</h1><p>所有游戏共用这份名单，暂离玩家会被自动排除在本局之外。</p></div></section>
  <section class="panel"><div class="panel-title"><strong>参与人数</strong><span>支持 2–12 人</span></div><div class="count-grid" role="group" aria-label="参与人数">${Array.from({length:11},(_,i)=>i+2).map(n=>`<button class="count-button ${n===state.players.length?'active':''}" data-count="${n}" aria-pressed="${n===state.players.length}">${n}</button>`).join('')}</div></section>
  <section class="players-editor"><div class="section-title compact"><div><span class="eyebrow">Party Roster</span><h2>玩家名称</h2><span>最多 4 个字符 · 支持临时离场</span></div></div><div class="player-list">${state.players.map(row).join('')}</div></section>
  <div class="sticky-actions"><button class="button secondary" data-random>随机昵称</button><button class="button primary" data-save>保存本场玩家</button></div>`;
  root.querySelector('[data-back]').onclick=()=>setRoute('lobby');
  root.querySelectorAll('[data-count]').forEach(button=>button.onclick=()=>resizePlayers(Number(button.dataset.count)));
  root.querySelectorAll('[data-away]').forEach(button=>button.onclick=()=>{const id=button.dataset.away;const players=getState().players.map(p=>p.id===id?{...p,active:!p.active}:p);setPlayers(players)});
  root.querySelector('[data-random]').onclick=()=>{root.querySelectorAll('.player-name').forEach((input,i)=>input.value=randomPool[(i+Math.floor(Math.random()*randomPool.length))%randomPool.length])};
  root.querySelector('[data-save]').onclick=()=>{
    const current=getState().players;
    const players=[...root.querySelectorAll('.player-row')].map((node,i)=>({id:node.dataset.id||uid('player'),name:[...(node.querySelector('input').value.trim()||`玩家${i+1}`)].slice(0,4).join(''),active:current.find(p=>p.id===node.dataset.id)?.active!==false}));
    const activeCount=players.filter(player=>player.active).length;
    if(activeCount<2){toast('至少保留 2 位在场玩家');return}
    setPlayers(players);toast('玩家名单已保存');setRoute('lobby');
  };
}
function row(player,index){return `<div class="player-row ${player.active?'':'is-away'}" data-id="${player.id}"><span class="avatar">${escapeHtml(initials(player.name))}</span><label><span class="sr-only">玩家${index+1}名称</span><input class="player-name" maxlength="4" value="${escapeHtml(player.name)}" autocomplete="off"></label><button class="away-button" data-away="${player.id}" aria-pressed="${!player.active}"><i></i>${player.active?'暂离':'恢复'}</button></div>`}
