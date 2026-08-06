import { LifecycleScope } from './lifecycle.js';
import { PunishmentService } from './punishment-service.js';
import { randomService } from './random.js';

export class GameRuntime {
  constructor({ contextFactory, onError = console.error }) {
    if (typeof contextFactory !== 'function') throw new TypeError('GameRuntime 需要 contextFactory');
    this.contextFactory = contextFactory;
    this.onError = onError;
    this.current = null;
    this.sequence = 0;
  }

  mount(input) {
    this.unmount();
    const sequence = ++this.sequence;
    const lifecycle = new LifecycleScope();
    const baseContext = this.contextFactory(input);
    baseContext.onCleanup(() => lifecycle.dispose());

    const context = {
      ...baseContext,
      lifecycle,
      services: Object.freeze({
        random: randomService,
        punishment: new PunishmentService((losers, options) => baseContext.punishment(losers, options))
      })
    };

    this.current = { sequence, game: input.game, context };

    try {
      const result = input.game.mount(input.root, context);
      Promise.resolve(result)
        .then(cleanup => {
          if (typeof cleanup !== 'function') return;
          if (this.current?.sequence === sequence) lifecycle.add(cleanup);
          else cleanup();
        })
        .catch(error => this.fail(sequence, error));
    } catch (error) {
      this.fail(sequence, error);
    }

    return context;
  }

  fail(sequence, error) {
    if (this.current?.sequence !== sequence) return;
    const game = this.current.game;
    this.unmount();
    this.onError(error, game);
  }

  unmount() {
    if (!this.current) return;
    const context = this.current.context;
    this.current = null;
    try { context.cleanup?.(); } catch (error) { console.warn('Game cleanup failed', error); }
  }
}
