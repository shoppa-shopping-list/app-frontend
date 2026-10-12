import { getTelegram } from '@/shared/telegram/telegram';
import { COLORS } from '@/entities/product/model';
import type { CartChange, OfflineState } from './offlineSlice';
import { emptyOffline } from './offlineSlice';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
export function offlineStorageKey(): string | null {
  try {
    // This ID partitions local data only. Server authorization still validates initData.
    const user: unknown = JSON.parse(
      new URLSearchParams(getTelegram()?.initData).get('user') ?? 'null',
    );
    return record(user) && typeof user.id === 'number' ? `shoppa:offline:v1:${user.id}` : null;
  } catch {
    return null;
  }
}
function deviceStorage() {
  const app = getTelegram();
  return app?.isVersionAtLeast?.('9.0') ? app.DeviceStorage : undefined;
}
function callbackResult<T>(start: (done: (result: T) => void) => void, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      resolve(fallback);
    }, 5000);
    const done = (result: T) => {
      window.clearTimeout(timer);
      resolve(result);
    };
    try {
      start(done);
    } catch {
      done(fallback);
    }
  });
}
export async function saveOffline(key: string | null, state: OfflineState): Promise<boolean> {
  try {
    if (!key) return false;
    const recoveryKey = `${key}:recovery`;
    const value = JSON.stringify(state);
    // Once selected, keep using this copy: native storage may contain an older write.
    if (readRecovery(key) !== null) {
      localStorage.setItem(recoveryKey, value);
      return true;
    }
    const device = deviceStorage();
    if (device) {
      const saved = await callbackResult<boolean>((done) => {
        device.setItem(key, value, (error, stored) => {
          done(!error && stored === true);
        });
      }, false);
      if (saved) return true;
      // Persist the current snapshot, never fall back to the old migration copy.
      localStorage.setItem(recoveryKey, value);
      return true;
    }
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
function readRecovery(key: string): string | null {
  try {
    return localStorage.getItem(`${key}:recovery`);
  } catch {
    // DeviceStorage can still work when WebView storage is disabled.
    return null;
  }
}
export async function loadOffline(key: string | null): Promise<OfflineState> {
  if (!key) return emptyOffline;
  try {
    const recovery = readRecovery(key);
    if (recovery !== null) return parseOffline(recovery);
    const device = deviceStorage();
    if (device) {
      const result = await callbackResult<{ ok: boolean; value: string | null }>(
        (done) => {
          device.getItem(key, (error, value) => {
            done({ ok: !error, value: value ?? null });
          });
        },
        { ok: false, value: null },
      );
      if (!result.ok) throw new Error('Device storage unavailable');
      if (result.value !== null) return parseOffline(result.value);
      let previous: string | null = null;
      try {
        previous = localStorage.getItem(key);
      } catch {
        // Native storage remains usable when browser storage is disabled.
      }
      const legacy = parseOffline(previous);
      if (legacy.products && !(await saveOffline(key, legacy))) throw new Error('Migration failed');
      return legacy;
    }
    return parseOffline(localStorage.getItem(key));
  } catch {
    throw new Error('Could not read saved data on this device. Please reopen Shoppa.');
  }
}
function parseOffline(raw: string | null): OfflineState {
  try {
    const data: unknown = JSON.parse(raw ?? 'null');
    const product = (value: unknown) =>
      record(value) &&
      typeof value.name === 'string' &&
      typeof value.color === 'string' &&
      Object.hasOwn(COLORS, value.color);
    if (
      record(data) &&
      Array.isArray(data.products) &&
      data.products.every(
        (value: unknown) =>
          product(value) &&
          record(value) &&
          typeof value.id === 'string' &&
          typeof value.createdAt === 'string' &&
          typeof value.isFavourite === 'boolean',
      ) &&
      Array.isArray(data.items) &&
      data.items.every(
        (value: unknown) =>
          product(value) &&
          record(value) &&
          typeof value.productId === 'string' &&
          typeof value.addedAt === 'string' &&
          typeof value.addedBy === 'number',
      )
    ) {
      // Read the earlier deletion-only format without losing unsent actions.
      const changes: unknown =
        data.changes ??
        (Array.isArray(data.removals)
          ? data.removals.map((id: unknown) => ({
              productId: id,
              toCart: false,
              token: `legacy:${String(id)}`,
            }))
          : null);
      if (
        Array.isArray(changes) &&
        changes.every(
          (entry: unknown) =>
            record(entry) &&
            typeof entry.productId === 'string' &&
            typeof entry.toCart === 'boolean' &&
            typeof entry.token === 'string',
        )
      ) {
        return { products: data.products, items: data.items, changes: changes as CartChange[] };
      }
    }
  } catch {
    // Invalid or unavailable storage must not prevent the online app from opening.
  }
  return emptyOffline;
}
