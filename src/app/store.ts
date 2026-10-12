import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { shoppaApi } from '@/shared/api/api';
import { createTransferListener } from '@/features/transfers/listener';
import { transfersReducer } from '@/features/transfers/transfersSlice';
import { offline, offlineReducer } from '@/features/offline/offlineSlice';
import { loadOffline, offlineStorageKey, saveOffline } from '@/features/offline/storage';

export function createStore() {
  const key = offlineStorageKey();
  let writes = Promise.resolve();
  const transaction = (job: () => Promise<void>) => {
    const next = writes.then(job);
    writes = next.catch(() => {
      /* A failed write must not stop subsequent attempts. */
    });
    return next;
  };
  const listener = createTransferListener(key, transaction);
  const result = configureStore({
    reducer: {
      [shoppaApi.reducerPath]: shoppaApi.reducer,
      transfers: transfersReducer,
      offline: offlineReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listener.middleware).concat(shoppaApi.middleware),
  });
  let previous = result.getState().offline;
  result.subscribe(() => {
    const next = result.getState().offline;
    if (next !== previous) {
      void transaction(async () => {
        await saveOffline(key, result.getState().offline);
      });
      previous = next;
    }
  });
  return result;
}
export const store = createStore();
export const storeReady = loadOffline(offlineStorageKey()).then((snapshot) => {
  store.dispatch(offline.hydrated(snapshot));
});
setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
