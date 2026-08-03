const VERSION='party-game-v9.2.4-fate-wheel-ui-only';
const SHELL=[
  './','./index.html','./manifest.webmanifest','./styles/app.css','./styles/games.css','./styles/adult-plus.css','./styles/ui-refresh.css','./styles/midnight-game-hall.css?v=9.2.3','./styles/fate-wheel-v9.2.4.css?v=9.2.4',
  './src/main.js','./src/core/utils.js','./src/core/store.js','./src/core/motion.js','./src/modules/overlay.js',
  './src/modules/lobby.js','./src/modules/players.js','./src/modules/game-sheet.js','./src/modules/settings.js','./src/modules/questions.js',
  './src/games/registry.js','./src/games/index.js','./src/games/shared.js','./src/games/dice.js','./src/games/wheel.js',
  './src/games/most-likely.js','./src/games/would-rather.js','./src/games/five-second.js','./src/games/hot-potato.js','./src/games/king.js','./src/games/undercover.js',
  './icons/icon-192.png','./icons/icon-512.png','./assets/midnight/brand-crest.svg','./assets/midnight/divider.svg','./assets/midnight/corner-flourish.svg','./assets/midnight/stage-arch.svg','./assets/midnight/starfield.svg'
];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(VERSION);await cache.addAll(SHELL);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)));await self.registration.navigationPreload?.enable();await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
async function networkFirst(request,fallback){
  const cache=await caches.open(VERSION);
  try{const response=await fetch(request,{cache:'no-store'});if(response.ok)await cache.put(request,response.clone());return response}catch{return (await cache.match(request))||(fallback?await cache.match(fallback):null)||Response.error()}
}
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==location.origin)return;
  if(request.mode==='navigate'){event.respondWith(networkFirst(request,'./index.html'));return}
  if(url.pathname.includes('/src/')||url.pathname.includes('/styles/')||url.pathname.includes('/assets/')){event.respondWith(networkFirst(request));return}
  if(url.pathname.includes('/data/')){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));return}
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));
});
