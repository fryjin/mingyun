import { adultPlusFilterKey, allowedByAdultPlus, drawGame, drawShared } from '../modules/questions.js';

export function createEligibilityPredicate(level = 'standard', preferences = {}, predicate) {
  const boundary = item => level !== 'adult-plus' || allowedByAdultPlus(item, preferences);
  if (typeof predicate !== 'function') return boundary;
  return item => boundary(item) && predicate(item);
}

export function poolKeyFor(level, preferences, suffix = '') {
  const base = level === 'adult-plus' ? adultPlusFilterKey(preferences) : 'all';
  return suffix ? `${base}:${suffix}` : base;
}

export class QuestionEngine {
  async drawGame({ gameId, settings, predicate, poolKeySuffix = '' }) {
    const level = settings?.level || 'standard';
    const preferences = settings?.adultPlus || {};
    const filter = createEligibilityPredicate(level, preferences, predicate);
    return drawGame(gameId, level, filter, poolKeyFor(level, preferences, poolKeySuffix));
  }

  async drawShared({ type, settings, predicate, poolKeySuffix = '' }) {
    const level = settings?.level || 'standard';
    const preferences = settings?.adultPlus || {};
    const filter = createEligibilityPredicate(level, preferences, predicate);
    return drawShared(level, type, filter, poolKeyFor(level, preferences, poolKeySuffix));
  }
}

export const questionEngine = new QuestionEngine();
