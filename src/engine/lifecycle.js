export class LifecycleScope {
  constructor() {
    this.cleanups = new Set();
    this.disposed = false;
  }

  add(cleanup) {
    if (typeof cleanup !== 'function') return cleanup;
    if (this.disposed) {
      cleanup();
      return cleanup;
    }
    this.cleanups.add(cleanup);
    return cleanup;
  }

  timeout(callback, delay) {
    const id = setTimeout(() => {
      this.cleanups.delete(cancel);
      if (!this.disposed) callback();
    }, delay);
    const cancel = () => clearTimeout(id);
    this.add(cancel);
    return id;
  }

  interval(callback, delay) {
    const id = setInterval(() => {
      if (!this.disposed) callback();
    }, delay);
    this.add(() => clearInterval(id));
    return id;
  }

  frame(callback) {
    const id = requestAnimationFrame(time => {
      this.cleanups.delete(cancel);
      if (!this.disposed) callback(time);
    });
    const cancel = () => cancelAnimationFrame(id);
    this.add(cancel);
    return id;
  }

  listen(target, event, handler, options) {
    target?.addEventListener?.(event, handler, options);
    this.add(() => target?.removeEventListener?.(event, handler, options));
    return handler;
  }

  child() {
    const child = new LifecycleScope();
    this.add(() => child.dispose());
    return child;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const cleanup of [...this.cleanups].reverse()) {
      try { cleanup(); } catch (error) { console.warn('Cleanup failed', error); }
    }
    this.cleanups.clear();
  }
}
