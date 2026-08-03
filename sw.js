const VERSION='party-game-v9.1.3';
const SHELL=[
  './','./index.html','./manifest.webmanifest','./styles/app.css','./styles/games.css','./styles/adult-plus.css',
  './src/main.js','./src/core/utils.js','./src/core/store.js','./src/core/motion.js','./src/modules/overlay.js',
  './src/modules/lobby.js','./src/modules/players.js','./src/modules/game-sheet.js','./src/modules/settings.js','./src/modules/questions.js',
  './src/games/registry.js','./src/games/index.js','./src/games/shared.js','./src/games/dice.js','./src/games/wheel.js',
  './src/games/most-likely.js','./src/games/would-rather.js','./src/games/five-second.js','./src/games/hot-potato.js','./src/games/king.js','./src/games/undercover.js',
  './icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))),self.registration.navigationPreload?.enable()]).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const preload=await event.preloadResponse;if(preload)return preload;const response=await fetch(request);const cache=await caches.open(VERSION);cache.put('./index.html',response.clone());return response}catch{return (await caches.match('./index.html'))||Response.error()}})());return;
  }
  if(url.pathname.includes('/data/')){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));
});
