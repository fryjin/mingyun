import './games/index.js';
import { activePlayers, getState, session, setRoute, subscribe } from './core/store.js';
import { createGameContext } from './games/shared.js';
import { getGame } from './games/registry.js';
import { renderLobby } from './modules/lobby.js';
import { renderPlayers } from './modules/players.js';
import { openGameSheet } from './modules/game-sheet.js';
import { openSettings } from './modules/settings.js';
import { confirmDialog, closeOverlay, toast } from './modules/overlay.js';
import { warmMotionEngine } from './core/motion.js';

warmMotionEngine();

const view=document.querySelector('#appView');
const back=document.querySelector('#backButton');
const brand=document.querySelector('#brandButton');
const settingsButton=document.querySelector('#settingsButton');
let currentContext=null;

function cleanupGame(){currentContext?.cleanup?.();currentContext=null;}
async function goLobby(){
  const state=getState();
  if(state.route.name==='game'){
    const ok=await confirmDialog({title:'结束当前游戏？',message:'本轮尚未完成的临时状态会被清除。',confirmText:'结束游戏',danger:true});
    if(!ok)return;
  }
  cleanupGame(); closeOverlay(); setRoute('lobby');
}
function render(){
  const state=getState();
  back.hidden=state.route.name==='lobby';
  settingsButton.hidden=state.route.name==='game';
  brand.classList.toggle('compact',state.route.name!=='lobby');
  if(state.route.name==='lobby'){cleanupGame();renderLobby(view,{openGameSheet,openSettings});return;}
  if(state.route.name==='players'){cleanupGame();renderPlayers(view);return;}
  if(state.route.name==='game'){
    cleanupGame();
    const game=getGame(state.route.gameId);if(!game){setRoute('lobby');return;}
    const players=activePlayers();
    if(players.length<game.minPlayers){toast(`至少需要 ${game.minPlayers} 位在场玩家`);setRoute('lobby');return;}
    const gameSettings={...game.defaultSettings,...(state.gameSettings[game.id]||{})};
    currentContext=createGameContext({root:view,game,settings:gameSettings,players,global:state.settings,goLobby,rerender:render});
    game.mount(view,currentContext);
  }
}
back.onclick=goLobby;
brand.onclick=()=>{if(getState().route.name!=='lobby')goLobby()};
settingsButton.onclick=openSettings;
subscribe(render);
render();

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const hadController=Boolean(navigator.serviceWorker.controller);
      const registration=await navigator.serviceWorker.register('./sw.js');
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&hadController&&registration.waiting)showUpdate(registration)});
      });
    }catch(error){console.warn('Service Worker registration failed',error)}
  });
}
function showUpdate(registration){
  const banner=document.querySelector('#updateBanner');banner.hidden=false;
  document.querySelector('#applyUpdate').onclick=()=>{registration.waiting?.postMessage({type:'SKIP_WAITING'});location.reload()};
}
navigator.serviceWorker?.addEventListener('controllerchange',()=>console.info('V9.1.1 service worker active'));
