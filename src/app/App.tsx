import { useCallback, useEffect, useState } from 'react';
import { syncCart } from '@/features/offline/offlineSlice';
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
  const snapshot = useAppSelector((state) => state.offline);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const retry = () => {
      setOnline(navigator.onLine);
      dispatch(syncCart());
    };
    retry();
    const timer = window.setInterval(retry, 15000);
    window.addEventListener('online', retry);
    window.addEventListener('offline', retry);
    document.addEventListener('visibilitychange', retry);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', retry);
      window.removeEventListener('offline', retry);
      document.removeEventListener('visibilitychange', retry);
    };
  }, [dispatch]);
  const { message, error } = useAppSelector((state) => state.transfers);
  const refresh = useCallback(() => {
    dispatch(syncCart());
    dispatch(shoppaApi.util.invalidateTags(['Products', 'Cart']));
  }, [dispatch]);
  const ready =
    (products.data !== undefined || snapshot.products !== null) &&
    (cart.data !== undefined || snapshot.items !== null);
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
      {(!online || !connected || queryError !== undefined || snapshot.changes.length > 0) && (
        <div className="connection" role="status">
          {snapshot.changes.length > 0
            ? 'Changes saved on this device. Waiting to sync.'
            : !online
              ? 'Offline. Showing your saved list.'
              : 'Reconnecting… Your list may be out of date.'}
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
