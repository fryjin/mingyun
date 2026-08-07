export class StateMachine {
  constructor({ initial, transitions = {}, context = {} } = {}) {
    if (typeof initial !== 'string' || !initial) throw new TypeError('状态机需要 initial');
    this.initial = initial;
    this.state = initial;
    this.transitions = new Map(Object.entries(transitions).map(([from, targets]) => [from, new Set(targets)]));
    this.context = { ...context };
    this.listeners = new Set();
  }

  can(next) {
    if (next === this.state) return true;
    const allowed = this.transitions.get(this.state);
    return Boolean(allowed?.has(next) || allowed?.has('*'));
  }

  transition(next, patch) {
    if (!this.can(next)) throw new Error(`非法状态切换：${this.state} -> ${next}`);
    const previous = this.state;
    if (typeof patch === 'function') this.context = { ...this.context, ...(patch({ ...this.context }) || {}) };
    else if (patch && typeof patch === 'object') this.context = { ...this.context, ...patch };
    this.state = next;
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot, previous);
    return snapshot;
  }

  reset(context = {}) {
    const previous = this.state;
    this.state = this.initial;
    this.context = { ...context };
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot, previous);
    return snapshot;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return Object.freeze({ state: this.state, context: Object.freeze({ ...this.context }) });
  }
}
