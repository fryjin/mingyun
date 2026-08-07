import { STACK_CONFIG } from './physics.js';

export function cameraTransform({ towerLength, height, arenaHeight, includeMoving = false }) {
  const visibleCount = Math.min(towerLength, STACK_CONFIG.maxVisibleBlocks);
  const rawHeight = STACK_CONFIG.baseBottom
    + visibleCount * STACK_CONFIG.blockStep
    + (includeMoving ? STACK_CONFIG.dropDistance + 40 : 42);
  const available = Math.max(220, arenaHeight - 30);

  let scale = Math.min(1, available / rawHeight);
  if (height >= 12) scale = Math.min(scale, 0.72);
  else if (height >= 8) scale = Math.min(scale, 0.82);
  else if (height >= 5) scale = Math.min(scale, 0.92);

  scale = Math.max(0.68, scale);
  const shift = height > 4 ? Math.min(28, (height - 4) * 2.2) : 0;
  return { scale, shift };
}

export function applyStackCamera(root, session, lifecycle, { includeMoving = false } = {}) {
  lifecycle.frame(() => {
    const arena = root.querySelector('.stack-arena');
    const world = root.querySelector('[data-stack-world]');
    if (!arena || !world) return;
    const { scale, shift } = cameraTransform({
      towerLength: session.tower.length,
      height: session.height(),
      arenaHeight: arena.clientHeight,
      includeMoving
    });
    world.style.setProperty('--camera-scale', scale.toFixed(3));
    world.style.setProperty('--camera-shift', `${shift}px`);
  });
}
