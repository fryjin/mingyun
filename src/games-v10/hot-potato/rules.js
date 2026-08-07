export const BOMB_RANGES = Object.freeze({
  short: Object.freeze([10, 20]),
  standard: Object.freeze([20, 40]),
  long: Object.freeze([40, 60])
});

export function getBombRange(duration = 'standard') {
  return BOMB_RANGES[duration] || BOMB_RANGES.standard;
}

export function drawBombDurationSeconds(duration, random) {
  const [min, max] = getBombRange(duration);
  return random.int(min, max);
}

export function directionLabel(direction) {
  return direction === 'counter' ? '逆时针' : '顺时针';
}
