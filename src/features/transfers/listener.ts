import { createListenerMiddleware } from '@reduxjs/toolkit';
import { shoppaApi } from '@/shared/api/api';
import { transfers } from './transfersSlice';
import { UNDO_MS } from '@/shared/config/behavior';
import type { TransfersState } from './transfersSlice';

// This state contract keeps features independent from the app/store module.
export function createTransferListener() {
  const listener = createListenerMiddleware<{ transfers: TransfersState }>();
  listener.startListening({
    actionCreator: transfers.requested,
    effect: async (action, api) => {
      const { productId, token } = action.payload;
      await api.delay(UNDO_MS);
      const current = api.getState().transfers.pending[productId];
      if (current?.token !== token || current.phase !== 'waiting') return;
      api.dispatch(transfers.saving(productId));
      const request = current.toCart
        ? api.dispatch(shoppaApi.endpoints.putApiShoppingListByProductId.initiate({ productId }))
        : api.dispatch(
            shoppaApi.endpoints.deleteApiShoppingListByProductId.initiate({ productId }),
          );
      try {
        await request.unwrap();
        // Keep the row until the authoritative cart arrives: avoids a flash of stale data.
        await api
          .dispatch(
            shoppaApi.endpoints.getApiShoppingList.initiate(undefined, {
              subscribe: false,
              forceRefetch: true,
            }),
          )
          .unwrap();
        api.dispatch(transfers.settled({ productId }));
      } catch {
        api.dispatch(
          transfers.settled({
            productId,
            error: `Could not move ${current.name}. Please try again.`,
          }),
        );
        api.dispatch(shoppaApi.util.invalidateTags(['Cart', 'Products']));
      } finally {
        request.reset();
      }
    },
  });
  return listener;
}
