import { adultPlusFilterKey, allowedByAdultPlus, drawGame, drawShared } from '../modules/questions.js';

export function createEligibilityPredicate(level = 'standard', preferences = {}, predicate) {
  const boundary = item => level !== 'adult-plus' || allowedByAdultPlus(item, preferences);
  if (typeof predicate !== 'function') return boundary;
  return item => boundary(item) && predicate(item);
}

export class QuestionEngine {
  async drawGame({ gameId, settings, predicate }) {
    const level = settings?.level || 'standard';
    const preferences = settings?.adultPlus || {};
    const filter = createEligibilityPredicate(level, preferences, predicate);
    const key = level === 'adult-plus' ? adultPlusFilterKey(preferences) : 'all';
    return drawGame(gameId, level, filter, key);
  }

  async drawShared({ type, settings, predicate }) {
    const level = settings?.level || 'standard';
    const preferences = settings?.adultPlus || {};
    const filter = createEligibilityPredicate(level, preferences, predicate);
    const key = level === 'adult-plus' ? adultPlusFilterKey(preferences) : 'all';
    return drawShared(level, type, filter, key);
  }
}

export const questionEngine = new QuestionEngine();
