export { animateLite, cancelMotion, prefersReducedMotion, warmMotionEngine } from '../core/motion.js';

export async function pulse(target, { duration = 520, scale = 1.08 } = {}) {
  if (!target) return null;
  const { animateLite } = await import('../core/motion.js');
  return animateLite(target, { scale: [1, scale, 1], duration, ease: 'out(4)' });
}

export async function rise(target, { duration = 620 } = {}) {
  if (!target) return null;
  const { animateLite } = await import('../core/motion.js');
  return animateLite(target, { y: [18, -4, 0], scale: [.72, 1.1, 1], opacity: [0, 1, 1], duration, ease: 'out(4)' });
}
