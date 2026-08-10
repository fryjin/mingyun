import '../games/index.js';
import { Application } from './application.js';
import { registerAppServiceWorker } from './service-worker.js';
import { warmMotionEngine } from '../motion/index.js';

const VERSION = '10.5.0';
const BUILD = 'v10.5.0-architecture-closeout';

async function resetOldBuildCaches() {
  try {
    const previous = localStorage.getItem('mingyun-build');
    if (previous === BUILD) return;
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('party-game-')).map(key => caches.delete(key)));
    }
    localStorage.setItem('mingyun-build', BUILD);
  } catch (error) {
    console.warn('Build cache reset skipped', error);
  }
}

await resetOldBuildCaches();
warmMotionEngine();

const application = new Application({
  view: document.querySelector('#appView'),
  backButton: document.querySelector('#backButton'),
  brandButton: document.querySelector('#brandButton'),
  settingsButton: document.querySelector('#settingsButton')
});

application.start();
registerAppServiceWorker({
  banner: document.querySelector('#updateBanner'),
  applyButton: document.querySelector('#applyUpdate')
});

globalThis.__MINGYUN__ = Object.freeze({ version: VERSION, build: BUILD, application });
