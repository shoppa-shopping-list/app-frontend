import { useEffect, useState } from 'react';

// SSE carries invalidations, never product data. Re-read after *every* connection, including reconnects.
export function useLiveUpdates(enabled: boolean, refresh: () => void): boolean {
  const [connected, setConnected] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    const events = new EventSource('/api/events');
    const opened = () => {
      setConnected(true);
      refresh();
    };
    const failed = () => {
      setConnected(false);
      refresh();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    events.addEventListener('changed', refresh);
    events.addEventListener('open', opened);
    events.addEventListener('error', failed);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', refresh);
    return () => {
      events.close();
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', refresh);
    };
  }, [enabled, refresh]);
  return connected;
}
