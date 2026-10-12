import { createListenerMiddleware } from '@reduxjs/toolkit';
import { shoppaApi } from '@/shared/api/api';
import { transfers } from './transfersSlice';
import { UNDO_MS } from '@/shared/config/behavior';
import type { TransfersState } from './transfersSlice';
import { offline, offlineReducer, syncCart } from '@/features/offline/offlineSlice';
import type { CartChange, OfflineState } from '@/features/offline/offlineSlice';
import type { CartItem } from '@/entities/product/model';
import { saveOffline } from '@/features/offline/storage';

const isOnline = () => navigator.onLine;

// This state contract keeps features independent from the app/store module.
export function createTransferListener(
  storageKey: string | null,
  transaction: (job: () => Promise<void>) => Promise<void>,
) {
  const listener = createListenerMiddleware<{ transfers: TransfersState; offline: OfflineState }>();
  let syncing = false;
  listener.startListening({
    actionCreator: syncCart,
    effect: async (_action, api) => {
      if (syncing || !isOnline()) return;
      syncing = true;
      const acknowledge = async (change: CartChange, item: CartItem | null) => {
        let saved = false;
        await transaction(async () => {
          const action = offline.acknowledged({ change, item });
          saved = await saveOffline(storageKey, offlineReducer(api.getState().offline, action));
          if (saved) api.dispatch(action);
        });
        return saved;
      };
      try {
        for (;;) {
          if (!isOnline()) break;
          const change = api.getState().offline.changes[0];
          if (!change) break;
          const { productId, toCart } = change;
          let response: Promise<CartItem | null>;
          let reset: () => void;
          if (toCart) {
            const request = api.dispatch(
              shoppaApi.endpoints.putApiShoppingListByProductId.initiate({ productId }),
            );
            response = request.unwrap();
            reset = () => {
              request.reset();
            };
          } else {
            const request = api.dispatch(
              shoppaApi.endpoints.deleteApiShoppingListByProductId.initiate({ productId }),
            );
            // DELETE has no response body; normalize void before joining both branches.
            response = request.unwrap().then(() => null);
            reset = () => {
              request.reset();
            };
          }
          try {
            const item = await response;
            // Keep the local overlay until the server snapshot has caught up.
            await api
              .dispatch(
                shoppaApi.endpoints.getApiShoppingList.initiate(undefined, {
                  subscribe: false,
                  forceRefetch: true,
                }),
              )
              .unwrap();
            if (!(await acknowledge(change, item))) break;
          } catch (error) {
            if (
              toCart &&
              typeof error === 'object' &&
              error !== null &&
              'status' in error &&
              error.status === 404
            ) {
              if (!(await acknowledge(change, null))) break;
              api.dispatch(
                transfers.syncFailed(
                  'A product no longer exists and could not be added to your cart.',
                ),
              );
              api.dispatch(shoppaApi.util.invalidateTags(['Products', 'Cart']));
              continue;
            }
            // Network, session and server failures all retain the durable queue.
            break;
          } finally {
            reset();
          }
        }
      } finally {
        syncing = false;
      }
    },
  });
  listener.startListening({
    actionCreator: transfers.requested,
    effect: async (action, api) => {
      const { productId, token } = action.payload;
      await api.delay(UNDO_MS);
      const current = api.getState().transfers.pending[productId];
      if (current?.token !== token || current.phase !== 'waiting') return;
      api.dispatch(transfers.saving(productId));
      await transaction(async () => {
        const snapshot = api.getState().offline;
        const change = { productId, token, toCart: current.toCart };
        const saved = await saveOffline(storageKey, {
          ...snapshot,
          changes: [...snapshot.changes.filter((entry) => entry.productId !== productId), change],
        });
        if (!saved) {
          api.dispatch(
            transfers.settled({
              productId,
              error: 'Could not save on this device. Your product was not moved.',
            }),
          );
          return;
        }
        api.dispatch(offline.queued(change));
        api.dispatch(transfers.settled({ productId }));
        api.dispatch(syncCart());
      });
    },
  });
  return listener;
}
