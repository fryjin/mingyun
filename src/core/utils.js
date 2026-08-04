export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
export const randomInt = (min, max) => {
  const range = max - min + 1;
  if (globalThis.crypto?.getRandomValues) {
    const data = new Uint32Array(1);
    crypto.getRandomValues(data);
    return min + (data[0] % range);
  }
  return min + Math.floor(Math.random() * range);
};
export const shuffle = values => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
export const pick = values => values[randomInt(0, values.length - 1)];
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${randomInt(1000,9999)}`;
export const initials = name => [...String(name || '玩')][0] || '玩';
export const formatPlayers = players => players.map(player => player.name).join('、');
export function vibrate(pattern, enabled = true) { if (enabled && navigator.vibrate) navigator.vibrate(pattern); }
let audioContext;
export function tone(frequency = 440, duration = 0.08, enabled = true, volume = 0.035) {
  if (!enabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {}
}
export function icon(name) {
  const icons = {
    dice:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="12" cy="12" r="1"/></svg>',
    wheel:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/></svg>',
    vote:'<svg viewBox="0 0 24 24"><path d="m9 11 2 2 4-5"/><rect x="5" y="4" width="14" height="16" rx="2"/></svg>',
    split:'<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18m5-4 4 4-4 4M16 8l4 4-4 4"/></svg>',
    timer:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 13l3-3"/></svg>',
    bomb:'<svg viewBox="0 0 24 24"><circle cx="10" cy="14" r="7"/><path d="m15 8 2-2 2 2M18 6c0-2 2-3 3-3"/></svg>',
    mask:'<svg viewBox="0 0 24 24"><path d="M4 6c5-2 11-2 16 0v7c0 5-4 8-8 8s-8-3-8-8zM7 11h3m4 0h3"/></svg>',
    crown:'<svg viewBox="0 0 24 24"><path d="m3 7 4 4 5-7 5 7 4-4-2 12H5z"/></svg>',
    users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2m2-10a3 3 0 0 1 0 6"/></svg>',
    pause:'<svg viewBox="0 0 24 24"><path d="M8 5v14m8-14v14"/></svg>',
    play:'<svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"/></svg>',
    did:'<svg viewBox="0 0 24 24"><path d="M7 12V7a2 2 0 0 1 4 0v4-6a2 2 0 0 1 4 0v6-4a2 2 0 0 1 4 0v7c0 4-3 7-7 7h-1c-3 0-5-1-7-4l-2-3a2 2 0 0 1 3-2l2 2"/><path d="m18 2 .5 1.5L20 4l-1.5.5L18 6l-.5-1.5L16 4l1.5-.5z"/></svg>',
    stories:'<svg viewBox="0 0 24 24"><path d="M4 5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-5 4V7a2 2 0 0 1 2-2z"/><path d="M8 9h6M8 12h4M18 8h1a2 2 0 0 1 2 2v8l-3-2"/></svg>',
    chaos:'<svg viewBox="0 0 24 24"><path d="M4 7h4c5 0 3 10 8 10h4"/><path d="m17 14 3 3-3 3M4 17h4c5 0 3-10 8-10h4"/><path d="m17 4 3 3-3 3"/></svg>',
    ladder:'<svg viewBox="0 0 24 24"><path d="M7 21V3M17 21V3M7 7h10M7 12h10M7 17h10"/><path d="m12 3 2-2 2 2"/></svg>'
  };
  return icons[name] || icons.dice;
}
