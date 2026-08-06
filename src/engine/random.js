function secureUnit() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] / 0x100000000;
  }
  return Math.random();
}

export function createSeededRandom(seed = Date.now()) {
  let state = Number(seed) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 0x100000000;
  };
}

export class RandomService {
  constructor(random = secureUnit) {
    this.random = random;
  }

  int(min, max) {
    const lower = Math.ceil(Number(min));
    const upper = Math.floor(Number(max));
    if (!Number.isFinite(lower) || !Number.isFinite(upper) || upper < lower) {
      throw new RangeError('随机整数范围无效');
    }
    return lower + Math.floor(this.random() * (upper - lower + 1));
  }

  pick(items) {
    if (!Array.isArray(items) || items.length === 0) return undefined;
    return items[this.int(0, items.length - 1)];
  }

  shuffle(items) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const target = this.int(0, index);
      [next[index], next[target]] = [next[target], next[index]];
    }
    return next;
  }
}

export const randomService = new RandomService();
