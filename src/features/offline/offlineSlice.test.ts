import { expect, it } from 'vitest';
import { offline, offlineReducer } from './offlineSlice';

it('keeps the latest choice when an earlier request finishes', () => {
  const add = { productId: 'cheese', toCart: true, token: 'first' };
  const remove = { ...add, toCart: false, token: 'second' };
  let state = offlineReducer(undefined, offline.queued(add));
  state = offlineReducer(state, offline.queued(remove));
  state = offlineReducer(
    state,
    offline.acknowledged({
      change: add,
      item: {
        productId: 'cheese',
        name: 'Cheese',
        color: 'yellow',
        addedAt: '2026-01-01',
        addedBy: 42,
      },
    }),
  );
  expect(state.changes).toEqual([remove]);
  state = offlineReducer(state, offline.acknowledged({ change: remove, item: null }));
  expect(state.changes).toEqual([]);
  expect(state.items).toEqual([]);
});
