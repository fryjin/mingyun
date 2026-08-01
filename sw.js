const CACHE_NAME = 'party-game-v4.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

async function cachePut(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function handleNavigation(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      event.waitUntil(cachePut(event.request, preload));
      return preload;
    }
    const network = await fetch(event.request);
    event.waitUntil(cachePut(event.request, network));
    return network;
  } catch {
    return (await caches.match('./index.html')) || Response.error();
  }
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request);
  const networkPromise = fetch(event.request)
    .then((response) => {
      event.waitUntil(cachePut(event.request, response));
      return response;
    })
    .catch(() => null);
  return cached || networkPromise || Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  event.respondWith(staleWhileRevalidate(event));
});
