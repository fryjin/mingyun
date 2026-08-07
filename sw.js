const VERSION='party-game-v10.2.0-medium-games';
const SHELL=[
  './','./index.html','./manifest.webmanifest','./styles/app.css','./styles/games.css','./styles/adult-plus.css','./styles/ui-refresh.css','./styles/midnight-game-hall.css?v=9.2.3','./styles/fate-wheel-v9.2.4.css?v=9.2.4','./styles/game-expansion-v9.3.css?v=9.3.1','./styles/fate-stack-v9.3.6.css?v=9.3.6','./styles/game-rules-v9.3.3.css?v=9.3.3',
  './src/app/bootstrap.js','./src/app/application.js','./src/app/service-worker.js',
  './src/engine/game-runtime.js','./src/engine/lifecycle.js','./src/engine/plugin.js','./src/engine/punishment-service.js','./src/engine/random.js','./src/engine/timer.js','./src/engine/turn-manager.js','./src/engine/visibility.js',
  './src/data-engine/content-repository.js','./src/data-engine/question-engine.js','./src/components/game-ui.js','./src/motion/index.js',
  './src/core/utils.js','./src/core/store.js','./src/core/motion.js','./src/modules/overlay.js','./src/modules/lobby.js','./src/modules/players.js','./src/modules/game-sheet.js','./src/modules/settings.js','./src/modules/questions.js',
  './src/games/registry.js','./src/games/index.js','./src/games/shared.js','./src/games/undercover.js','./src/games/two-truths-one-lie.js','./src/games/chaos-rules.js','./src/games/fate-ladder.js',
  './src/games-v10/dice/index.js','./src/games-v10/dice/view.js','./src/games-v10/most-likely/index.js','./src/games-v10/most-likely/view.js',
  './src/games-v10/wheel/index.js','./src/games-v10/wheel/view.js','./src/games-v10/would-rather/index.js','./src/games-v10/would-rather/view.js','./src/games-v10/five-second/index.js','./src/games-v10/five-second/view.js',
  './src/games-v10/king/index.js','./src/games-v10/king/rules.js','./src/games-v10/king/view.js',
  './src/games-v10/i-did-it/index.js','./src/games-v10/i-did-it/rules.js','./src/games-v10/i-did-it/view.js',
  './src/games-v10/hot-potato/index.js','./src/games-v10/hot-potato/rules.js','./src/games-v10/hot-potato/view.js',
  './icons/icon-192.png','./icons/icon-512.png','./assets/midnight/brand-crest.svg','./assets/midnight/divider.svg','./assets/midnight/corner-flourish.svg','./assets/midnight/stage-arch.svg','./assets/midnight/starfield.svg'
];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(VERSION);await cache.addAll(SHELL);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('party-game-')&&key!==VERSION).map(key=>caches.delete(key)));await self.registration.navigationPreload?.enable();await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
async function networkFirst(request,fallback){const cache=await caches.open(VERSION);try{const response=await fetch(request,{cache:'no-store'});if(response.ok)await cache.put(request,response.clone());return response}catch{return(await cache.match(request,{ignoreSearch:true}))||(fallback?await cache.match(fallback,{ignoreSearch:true}):null)||Response.error()}}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==location.origin)return;if(request.mode==='navigate'){event.respondWith(networkFirst(request,'./index.html'));return}if(url.pathname.includes('/data/')){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));return}if(url.pathname.includes('/assets/')||url.pathname.includes('/icons/')){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));return}event.respondWith(networkFirst(request))});
