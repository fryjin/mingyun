export class AnimationRegistry {
  constructor(lifecycle) {
    this.animations = new Set();
    lifecycle?.add?.(() => this.cancelAll());
  }

  play(target, keyframes, options) {
    if (!target?.animate) return null;
    const animation = target.animate(keyframes, options);
    this.track(animation);
    return animation;
  }

  track(animation) {
    if (!animation) return animation;
    this.animations.add(animation);
    Promise.resolve(animation.finished).then(
      () => this.animations.delete(animation),
      () => this.animations.delete(animation)
    );
    return animation;
  }

  async wait(animation) {
    if (!animation) return;
    try {
      await animation.finished;
    } catch {}
  }

  cancelAll() {
    for (const animation of this.animations) {
      try { animation.cancel(); } catch {}
    }
    this.animations.clear();
  }

  size() {
    return this.animations.size;
  }
}
