export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

export function secureRandomInt(max) {
  if (!Number.isFinite(max) || max <= 0) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return Math.floor((values[0] / 4294967296) * max);
  }
  return Math.floor(Math.random() * max);
}

export function secureShuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = secureRandomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function levelLabel(level) {
  return ({ 1:'轻松', 2:'标准', 3:'大胆', 4:'成人刺激' })[Number(level)] || '标准';
}

export function announce(message) {
  const region = document.querySelector('#liveRegion');
  if (region) region.textContent = message;
}

export function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || min));
}

export function randomChoice(items) {
  return items[secureRandomInt(items.length)] || null;
}
