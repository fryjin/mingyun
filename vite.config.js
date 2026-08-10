import { defineConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const APP_VERSION = '10.5.0';
const STATIC_ENTRIES = ['assets', 'data', 'icons', 'manifest.webmanifest'];

function copyRuntimeAssets() {
  return {
    name: 'mingyun-copy-runtime-assets',
    apply: 'build',
    async closeBundle() {
      const output = resolve('dist');
      await mkdir(output, { recursive: true });
      for (const entry of STATIC_ENTRIES) {
        await cp(resolve(entry), resolve(output, entry), { recursive: true, force: true });
      }
    }
  };
}

function buildServiceWorker() {
  return {
    name: 'mingyun-build-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const generated = Object.keys(bundle).map(file => `./${file}`);
      const shell = [
        './',
        './index.html',
        './manifest.webmanifest',
        './icons/icon-192.png',
        './icons/icon-512.png',
        './assets/midnight/brand-crest.svg',
        './assets/midnight/divider.svg',
        './assets/midnight/corner-flourish.svg',
        './assets/midnight/stage-arch.svg',
        './assets/midnight/starfield.svg',
        ...generated
      ];
      const source = `const VERSION='party-game-v${APP_VERSION}-vite';
const SHELL=${JSON.stringify(shell)};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(VERSION);await cache.addAll(SHELL);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('party-game-')&&key!==VERSION).map(key=>caches.delete(key)));await self.registration.navigationPreload?.enable();await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
async function networkFirst(request,fallback){const cache=await caches.open(VERSION);try{const response=await fetch(request,{cache:'no-store'});if(response.ok)await cache.put(request,response.clone());return response}catch{return(await cache.match(request,{ignoreSearch:true}))||(fallback?await cache.match(fallback,{ignoreSearch:true}):null)||Response.error()}}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==location.origin)return;if(request.mode==='navigate'){event.respondWith(networkFirst(request,'./index.html'));return}if(url.pathname.includes('/data/')){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));return}if(url.pathname.includes('/assets/')||url.pathname.includes('/icons/')){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response})));return}event.respondWith(networkFirst(request))});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    }
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames(assetInfo) {
          if (assetInfo.name?.endsWith('.css')) return 'assets/app.css';
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  plugins: [buildServiceWorker(), copyRuntimeAssets()]
});
