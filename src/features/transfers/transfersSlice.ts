import { createSlice, nanoid } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Transfer {
  productId: string;
  name: string;
  toCart: boolean;
  token: string;
  startedAt: number;
  phase: 'waiting' | 'saving';
}
export interface TransfersState {
  pending: Record<string, Transfer | undefined>;
  message: string;
  error: string;
}
const initialState: TransfersState = { pending: {}, message: '', error: '' };
const slice = createSlice({
  name: 'transfers',
  initialState,
  reducers: {
    requested: {
      prepare: (input: Pick<Transfer, 'productId' | 'name' | 'toCart'>) => ({
        payload: { ...input, token: nanoid(), startedAt: Date.now(), phase: 'waiting' as const },
      }),
      reducer: (state, action: PayloadAction<Transfer>) => {
        if (state.pending[action.payload.productId]) return;
        state.pending[action.payload.productId] = action.payload;
        state.error = '';
        state.message = `${action.payload.name}: tap again to undo.`;
      },
    },
    cancelled: (state, action: PayloadAction<string>) => {
      const transfer = state.pending[action.payload];
      if (transfer?.phase !== 'waiting') return;
      state.pending[action.payload] = undefined;
      state.message = `${transfer.name}: move cancelled.`;
    },
    cancelWaiting: (state) => {
      for (const [id, transfer] of Object.entries(state.pending)) {
        if (transfer?.phase === 'waiting') state.pending[id] = undefined;
      }
    },
    saving: (state, action: PayloadAction<string>) => {
      const transfer = state.pending[action.payload];
      if (transfer) transfer.phase = 'saving';
    },
    settled: (state, action: PayloadAction<{ productId: string; error?: string }>) => {
      const transfer = state.pending[action.payload.productId];
      state.pending[action.payload.productId] = undefined;
      if (action.payload.error !== undefined) {
        state.error = action.payload.error;
      }
      if (transfer)
        state.message =
          action.payload.error ??
          `${transfer.name} moved ${transfer.toCart ? 'to your cart' : 'back to your list'}.`;
    },
    dismissError: (state) => {
      state.error = '';
    },
  },
});
export const transfersReducer = slice.reducer;
export const transfers = slice.actions;
