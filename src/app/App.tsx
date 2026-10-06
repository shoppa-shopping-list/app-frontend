import { useCallback } from 'react';
import { Outlet } from 'react-router';
import { useProductsQuery, useCartQuery, shoppaApi } from '@/shared/api/api';
import { useLiveUpdates } from '@/shared/api/useLiveUpdates';
import { transfers } from '@/features/transfers/transfersSlice';
import { useAppDispatch, useAppSelector } from './hooks';
import { useAppLifecycle } from './useAppLifecycle';

export function App() {
  const products = useProductsQuery({});
  const cart = useCartQuery();
  const dispatch = useAppDispatch();
  const { message, error } = useAppSelector((state) => state.transfers);
  const refresh = useCallback(() => {
    dispatch(shoppaApi.util.invalidateTags(['Products', 'Cart']));
  }, [dispatch]);
  const ready = products.data !== undefined && cart.data !== undefined;
  const connected = useLiveUpdates(ready, refresh);
  useAppLifecycle();
  const queryError = products.error ?? cart.error;
  const unauthorized =
    queryError !== undefined && 'status' in queryError && queryError.status === 401;
  if (unauthorized)
    return (
      <main className="gate">
        <h1>Open Shoppa in Telegram</h1>
        <p>Use the app button in your Telegram bot. Your session may have expired.</p>
        <button type="button" onClick={refresh}>
          Try again
        </button>
      </main>
    );
  if (!ready)
    return (
      <main className="gate" aria-busy={!queryError}>
        <h1>Shoppa</h1>
        {queryError ? (
          <>
            <p role="alert">Could not load your products.</p>
            <button type="button" onClick={refresh}>
              Try again
            </button>
          </>
        ) : (
          <p role="status">Loading your list…</p>
        )}
      </main>
    );
  return (
    <>
      {(!connected || queryError !== undefined) && (
        <div className="connection" role="status">
          Reconnecting… Your list may be out of date.
          <button type="button" onClick={refresh}>
            Retry
          </button>
        </div>
      )}
      <Outlet />
      <div className="sr-only" role="status" aria-live="polite">
        {message}
      </div>
      {error.length > 0 && (
        <div className="toast" role="alert">
          {error}
          <button
            type="button"
            onClick={() => {
              dispatch(transfers.dismissError());
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
