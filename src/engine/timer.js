export class TimerController {
  constructor({ durationMs, tickRateMs = 100, onTick = () => {}, onDone = () => {} }) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) throw new RangeError('计时长度必须大于 0');
    this.durationMs = durationMs;
    this.tickRateMs = Math.max(16, tickRateMs);
    this.onTick = onTick;
    this.onDone = onDone;
    this.remainingMs = durationMs;
    this.startedAt = 0;
    this.intervalId = 0;
    this.state = 'idle';
  }

  start() {
    if (this.state === 'running') return;
    if (this.state === 'finished') this.reset();
    this.state = 'running';
    this.startedAt = performance.now();
    this.onTick(this.remainingMs);
    this.intervalId = setInterval(() => this.tick(), this.tickRateMs);
  }

  tick() {
    if (this.state !== 'running') return;
    const now = performance.now();
    const elapsed = now - this.startedAt;
    this.startedAt = now;
    this.remainingMs = Math.max(0, this.remainingMs - elapsed);
    this.onTick(this.remainingMs);
    if (this.remainingMs <= 0) {
      this.stopInterval();
      this.state = 'finished';
      this.onDone();
    }
  }

  pause() {
    if (this.state !== 'running') return;
    this.tick();
    this.stopInterval();
    if (this.state !== 'finished') this.state = 'paused';
  }

  resume() {
    if (this.state !== 'paused') return;
    this.start();
  }

  reset() {
    this.stopInterval();
    this.remainingMs = this.durationMs;
    this.state = 'idle';
  }

  cancel() {
    this.stopInterval();
    this.state = 'cancelled';
  }

  stopInterval() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = 0;
  }
}
