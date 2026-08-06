import test from 'node:test';
import assert from 'node:assert/strict';
import { ContentRepository } from '../../src/data-engine/content-repository.js';
import { RandomService, createSeededRandom } from '../../src/engine/random.js';

test('repository caches requests and draws without immediate repeats', async () => {
  let calls = 0;
  const repository = new ContentRepository({
    baseUrl: '/data',
    fetcher: async () => {
      calls += 1;
      return { ok: true, async json() { return [{ id: 'a' }, { id: 'b' }]; } };
    }
  });
  const random = new RandomService(createSeededRandom(3));
  const first = await repository.draw('items.json', { random });
  const second = await repository.draw('items.json', { random });
  assert.notEqual(first.id, second.id);
  assert.equal(calls, 1);
});
