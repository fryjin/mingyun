const CACHE_VERSION = 'mingyun-v9.2-shell-1';
const QUESTION_CACHE = 'mingyun-v9.2-questions-1';
const GAME_CONTENT_CACHE = 'mingyun-v9.2-game-content-1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './styles/app.css',
  './styles/games.css',
  './src/main.js',
  './src/modules/lobby.js',
  './src/modules/players.js',
  './src/modules/games.js',
  './src/modules/questions.js',
  './src/modules/game-content.js',
  './src/games/shared.js',
  './src/games/most-likely.js',
  './src/games/would-rather.js',
  './src/games/five-second.js',
  './src/games/hot-potato.js',
  './data/games/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const activeCaches = new Set([CACHE_VERSION, QUESTION_CACHE, GAME_CONTENT_CACHE]);
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys.filter((key) => !activeCaches.has(key)).map((key) => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.includes('/data/questions/')) {
    event.respondWith(staleWhileRevalidate(request, QUESTION_CACHE));
    return;
  }

  if (url.pathname.includes('/data/games/')) {
    event.respondWith(staleWhileRevalidate(request, GAME_CONTENT_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_VERSION, './index.html'));
    return;
  }

  event.respondWith(cacheFirst(request, CACHE_VERSION));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  if (cached) {
    network.catch(() => null);
    return cached;
  }

  const response = await network;
  return response || new Response('Content bank unavailable', { status:503 });
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || cache.match(fallbackUrl);
  }
}
