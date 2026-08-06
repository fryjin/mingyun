import { adultPlusFilterKey, allowedByAdultPlus, drawGame, drawShared } from '../modules/questions.js';

export class QuestionEngine {
  async drawGame({ gameId, settings, predicate }) {
    const level = settings?.level || 'standard';
    const preferences = settings?.adultPlus || {};
    const filter = predicate || (item => level !== 'adult-plus' || allowedByAdultPlus(item, preferences));
    const key = level === 'adult-plus' ? adultPlusFilterKey(preferences) : 'all';
    return drawGame(gameId, level, filter, key);
  }

  async drawShared({ type, settings, predicate }) {
    const level = settings?.level || 'standard';
    const preferences = settings?.adultPlus || {};
    const filter = predicate || (item => level !== 'adult-plus' || allowedByAdultPlus(item, preferences));
    const key = level === 'adult-plus' ? adultPlusFilterKey(preferences) : 'all';
    return drawShared(level, type, filter, key);
  }
}

export const questionEngine = new QuestionEngine();
