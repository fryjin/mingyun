export const STACK_CONFIG = Object.freeze({
  worldWidth: 1000,
  blockWidth: 500,
  baseWidth: 640,
  minOverlapRatio: 0.20,
  perfectRatio: 0.03,
  dangerClearanceRatio: 0.22,
  offsetClearanceRatio: 0.48,
  maxVisibleBlocks: 8,
  blockStep: 38,
  baseBottom: 22,
  dropDistance: 88
});

export function speedFor(height) {
  if (height < 4) return 320;
  if (height < 8) return 360;
  if (height < 12) return 415;
  return 470;
}

export function safetyMarginRatio(height) {
  if (height < 5) return 0.04;
  if (height < 10) return 0.05;
  return 0.06;
}

export function createBaseTower() {
  const { worldWidth, baseWidth } = STACK_CONFIG;
  return [{
    left: (worldWidth - baseWidth) / 2,
    width: baseWidth,
    playerId: null,
    base: true,
    perfect: true
  }];
}

export function evaluateTower(blocks) {
  if (blocks.length <= 1) {
    return { stable: true, state: 'stable', direction: 0, tilt: 0, minClearance: 1, failureIndex: -1 };
  }

  const count = blocks.length;
  const suffixCenter = Array(count + 1).fill(0);
  const suffixWeight = Array(count + 1).fill(0);

  for (let index = count - 1; index >= 1; index -= 1) {
    suffixCenter[index] = suffixCenter[index + 1] + blocks[index].left + blocks[index].width / 2;
    suffixWeight[index] = suffixWeight[index + 1] + 1;
  }

  const margin = STACK_CONFIG.blockWidth * safetyMarginRatio(count - 1);
  let minClearance = Number.POSITIVE_INFINITY;
  let worstDirection = 0;
  let worstSupport = -1;

  for (let supportIndex = count - 2; supportIndex >= 0; supportIndex -= 1) {
    const support = blocks[supportIndex];
    const firstAbove = blocks[supportIndex + 1];
    const overlapLeft = Math.max(support.left, firstAbove.left);
    const overlapRight = Math.min(support.left + support.width, firstAbove.left + firstAbove.width);
    const effectiveLeft = overlapLeft + margin;
    const effectiveRight = overlapRight - margin;

    if (effectiveRight <= effectiveLeft || suffixWeight[supportIndex + 1] <= 0) {
      return {
        stable: false,
        state: 'danger',
        direction: firstAbove.left + firstAbove.width / 2 < support.left + support.width / 2 ? -1 : 1,
        tilt: 0,
        minClearance: -1,
        failureIndex: supportIndex
      };
    }

    const centerOfMass = suffixCenter[supportIndex + 1] / suffixWeight[supportIndex + 1];
    const supportCenter = (effectiveLeft + effectiveRight) / 2;
    const halfSpan = Math.max(1, (effectiveRight - effectiveLeft) / 2);
    const clearance = Math.min(centerOfMass - effectiveLeft, effectiveRight - centerOfMass);
    const normalized = clearance / halfSpan;

    if (centerOfMass < effectiveLeft || centerOfMass > effectiveRight) {
      return {
        stable: false,
        state: 'danger',
        direction: centerOfMass < supportCenter ? -1 : 1,
        tilt: 0,
        minClearance: normalized,
        failureIndex: supportIndex
      };
    }

    if (normalized < minClearance) {
      minClearance = normalized;
      worstDirection = centerOfMass < supportCenter ? -1 : centerOfMass > supportCenter ? 1 : 0;
      worstSupport = supportIndex;
    }
  }

  const state = minClearance < STACK_CONFIG.dangerClearanceRatio
    ? 'danger'
    : minClearance < STACK_CONFIG.offsetClearanceRatio
      ? 'offset'
      : 'stable';
  const tilt = state === 'danger' ? worstDirection * 0.72 : state === 'offset' ? worstDirection * 0.30 : 0;

  return {
    stable: true,
    state,
    direction: worstDirection,
    tilt,
    minClearance: Number.isFinite(minClearance) ? minClearance : 1,
    failureIndex: worstSupport
  };
}

export function evaluatePlacement(tower, moving, playerId) {
  const top = tower[tower.length - 1];
  const movingRight = moving.left + moving.width;
  const topRight = top.left + top.width;
  const overlapLeft = Math.max(moving.left, top.left);
  const overlapRight = Math.min(movingRight, topRight);
  const overlap = Math.max(0, overlapRight - overlapLeft);
  const minimum = STACK_CONFIG.blockWidth * STACK_CONFIG.minOverlapRatio;
  const centerGap = Math.abs(
    (moving.left + moving.width / 2) - (top.left + top.width / 2)
  );

  if (overlap < minimum) {
    return {
      outcome: 'miss',
      overlap,
      minimum,
      centerGap,
      finalHeight: Math.max(0, tower.length - 1),
      direction: moving.direction,
      failureIndex: tower.length - 1
    };
  }

  const candidate = {
    left: moving.left,
    width: STACK_CONFIG.blockWidth,
    playerId,
    base: false,
    perfect: false
  };
  const candidateTower = [...tower, candidate];
  const balance = evaluateTower(candidateTower);

  if (!balance.stable) {
    return {
      outcome: 'balance',
      candidate,
      tower: candidateTower,
      balance,
      finalHeight: Math.max(0, tower.length - 1),
      direction: balance.direction,
      failureIndex: balance.failureIndex,
      overlap,
      minimum,
      centerGap
    };
  }

  const perfect = centerGap <= STACK_CONFIG.blockWidth * STACK_CONFIG.perfectRatio
    && balance.state === 'stable';
  candidate.perfect = perfect;

  return {
    outcome: 'success',
    candidate,
    tower: candidateTower,
    balance,
    perfect,
    overlap,
    minimum,
    centerGap,
    finalHeight: candidateTower.length - 1
  };
}
