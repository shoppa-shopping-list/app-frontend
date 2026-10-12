import { createAction, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Product, CartItem } from '@/entities/product/model';
import { shoppaApi } from '@/shared/api/api';

export interface CartChange {
  productId: string;
  toCart: boolean;
  token: string;
}
export interface OfflineState {
  products: Product[] | null;
  items: CartItem[] | null;
  changes: CartChange[];
}
export const emptyOffline: OfflineState = { products: null, items: null, changes: [] };
const slice = createSlice({
  name: 'offline',
  initialState: emptyOffline,
  reducers: {
    hydrated: (_state, action: PayloadAction<OfflineState>) => action.payload,
    queued: (state, action: PayloadAction<CartChange>) => {
      state.changes = state.changes.filter(
        (change) => change.productId !== action.payload.productId,
      );
      state.changes.push(action.payload);
    },
    acknowledged: (state, action: PayloadAction<{ change: CartChange; item: CartItem | null }>) => {
      const { change, item } = action.payload;
      state.items = state.items?.filter((entry) => entry.productId !== change.productId) ?? [];
      if (item) state.items.push(item);
      // A response for an older request must not erase a newer local choice.
      state.changes = state.changes.filter((entry) => entry.token !== change.token);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(shoppaApi.endpoints.getApiCatalog.matchFulfilled, (state, action) => {
      if (!action.meta.arg.originalArgs.name) state.products = action.payload.products;
    });
    builder.addMatcher(shoppaApi.endpoints.getApiShoppingList.matchFulfilled, (state, action) => {
      state.items = action.payload.items;
    });
  },
});
export const offlineReducer = slice.reducer;
export const offline = slice.actions;
export const syncCart = createAction('offline/sync');
