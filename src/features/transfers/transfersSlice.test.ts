import { describe, expect, it } from 'vitest';
import { transfers, transfersReducer } from './transfersSlice';
const input = { productId: 'cheese', name: 'Cheese', toCart: true };
describe('undoable moves', () => {
  it('cancels waiting moves and leaves other products untouched', () => {
    let state = transfersReducer(undefined, transfers.requested(input));
    state = transfersReducer(state, transfers.requested({ ...input, productId: 'milk' }));
    state = transfersReducer(state, transfers.cancelled('cheese'));
    expect(state.pending.cheese).toBeUndefined();
    expect(state.pending.milk?.phase).toBe('waiting');
    expect(state.message).toContain('cancelled');
  });
  it('does not restart a pending move or undo a request already being saved', () => {
    let state = transfersReducer(undefined, transfers.requested(input));
    const token = state.pending.cheese?.token;
    state = transfersReducer(state, transfers.requested(input));
    expect(state.pending.cheese?.token).toBe(token);
    state = transfersReducer(state, transfers.saving('cheese'));
    state = transfersReducer(state, transfers.cancelled('cheese'));
    expect(state.pending.cheese?.phase).toBe('saving');
  });
  it('cancels only waiting operations when the app is hidden', () => {
    let state = transfersReducer(undefined, transfers.requested(input));
    state = transfersReducer(state, transfers.requested({ ...input, productId: 'milk' }));
    state = transfersReducer(state, transfers.saving('milk'));
    state = transfersReducer(state, transfers.cancelWaiting());
    expect(state.pending.cheese).toBeUndefined();
    expect(state.pending.milk?.phase).toBe('saving');
  });
  it('clears completed moves, reports failures and can dismiss them', () => {
    let state = transfersReducer(undefined, transfers.requested(input));
    state = transfersReducer(state, transfers.settled({ productId: 'cheese' }));
    expect(state.message).toContain('to your cart');
    state = transfersReducer(state, transfers.requested({ ...input, toCart: false }));
    state = transfersReducer(state, transfers.settled({ productId: 'cheese' }));
    expect(state.message).toContain('back to your list');
    state = transfersReducer(state, transfers.requested(input));
    state = transfersReducer(state, transfers.settled({ productId: 'cheese', error: 'Try again' }));
    expect(state.error).toBe('Try again');
    expect(state.pending.cheese).toBeUndefined();
    expect(transfersReducer(state, transfers.dismissError()).error).toBe('');
  });
  it('tolerates events for a product that is no longer pending', () => {
    let state = transfersReducer(undefined, transfers.cancelled('missing'));
    state = transfersReducer(state, transfers.saving('missing'));
    state = transfersReducer(state, transfers.settled({ productId: 'missing' }));
    expect(state.error).toBe('');
  });
});

it('keeps a failed clear-cart operation visible when another product succeeds later', () => {
  let state = transfersReducer(undefined, transfers.requested(input));
  state = transfersReducer(state, transfers.requested({ ...input, productId: 'milk' }));
  state = transfersReducer(
    state,
    transfers.settled({ productId: 'cheese', error: 'Cheese could not be moved' }),
  );
  state = transfersReducer(state, transfers.settled({ productId: 'milk' }));
  expect(state.error).toBe('Cheese could not be moved');
});
