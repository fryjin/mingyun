export class FrameLoop {
  constructor({
    lifecycle,
    onFrame,
    maxDeltaMs = 34,
    schedule = callback => requestAnimationFrame(callback),
    cancel = id => cancelAnimationFrame(id)
  } = {}) {
    if (typeof onFrame !== 'function') throw new TypeError('FrameLoop 需要 onFrame');
    this.onFrame = onFrame;
    this.maxDeltaMs = Math.max(1, Number(maxDeltaMs) || 34);
    this.schedule = schedule;
    this.cancel = cancel;
    this.frameId = 0;
    this.lastTime = 0;
    this.running = false;
    lifecycle?.add?.(() => this.stop());
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    this.frameId = this.schedule(time => this.tick(time));
  }

  tick(time) {
    if (!this.running) return;
    const deltaMs = this.lastTime ? Math.min(this.maxDeltaMs, Math.max(0, time - this.lastTime)) : 0;
    this.lastTime = time;
    const keepRunning = this.onFrame({ time, deltaMs });
    if (!this.running || keepRunning === false) {
      this.stop();
      return;
    }
    this.frameId = this.schedule(nextTime => this.tick(nextTime));
  }

  stop() {
    if (this.frameId) this.cancel(this.frameId);
    this.frameId = 0;
    this.lastTime = 0;
    this.running = false;
  }

  isRunning() {
    return this.running;
  }
}
