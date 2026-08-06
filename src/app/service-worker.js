export async function registerAppServiceWorker({ banner, applyButton } = {}) {
  if (!('serviceWorker' in navigator)) return null;
  if (import.meta.env?.DEV) return null;

  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const revealUpdate = () => {
      if (!registration.waiting || !banner || !applyButton) return;
      banner.hidden = false;
      applyButton.onclick = () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    };

    revealUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) revealUpdate();
      });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });

    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed', error);
    return null;
  }
}
