import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { shoppaApi } from '@/shared/api/api';
import { createTransferListener } from '@/features/transfers/listener';
import { transfersReducer } from '@/features/transfers/transfersSlice';

export function createStore() {
  const listener = createTransferListener();
  return configureStore({
    reducer: { [shoppaApi.reducerPath]: shoppaApi.reducer, transfers: transfersReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listener.middleware).concat(shoppaApi.middleware),
  });
}
export const store = createStore();
setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
