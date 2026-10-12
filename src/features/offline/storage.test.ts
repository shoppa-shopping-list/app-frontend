import type { DeviceStorage } from '@/shared/telegram/telegram';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyOffline } from './offlineSlice';
import { loadOffline, saveOffline } from './storage';

const snapshot = {
  products: [
    {
      id: 'cheese',
      name: 'Cheese',
      color: 'yellow' as const,
      createdAt: '2026-01-01',
      isFavourite: false,
    },
  ],
  items: [
    {
      productId: 'cheese',
      name: 'Cheese',
      color: 'yellow' as const,
      addedAt: '2026-01-01',
      addedBy: 42,
    },
  ],
  changes: [{ productId: 'cheese', toCart: true, token: 'new-choice' }],
};
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('durable cart storage', () => {
  it('restores the cart and pending removals together, isolated by user', async () => {
    expect(await saveOffline('user42', snapshot)).toBe(true);
    expect(await loadOffline('user42')).toEqual(snapshot);
    expect(await loadOffline('user43')).toEqual(emptyOffline);
  });
  it('migrates previously saved removals', async () => {
    const old = { products: snapshot.products, items: snapshot.items };
    localStorage.setItem('user42', JSON.stringify({ ...old, removals: ['cheese'] }));
    expect((await loadOffline('user42')).changes).toEqual([
      { productId: 'cheese', toCart: false, token: 'legacy:cheese' },
    ]);
  });
  it('ignores malformed JSON and invalid product shapes', async () => {
    localStorage.setItem('user42', '{');
    expect(await loadOffline('user42')).toEqual(emptyOffline);
    localStorage.setItem('user42', JSON.stringify({ ...snapshot, products: [{ id: 'cheese' }] }));
    expect(await loadOffline('user42')).toEqual(emptyOffline);
  });
  it('reports write failures instead of claiming persistence', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Full');
    });
    expect(await saveOffline('user42', snapshot)).toBe(false);
    expect(await saveOffline(null, snapshot)).toBe(false);
  });
});

it('uses Telegram DeviceStorage and migrates the browser snapshot once', async () => {
  const saved = new Map<string, string>();
  const device: DeviceStorage = {
    getItem: (key, callback) => {
      queueMicrotask(() => {
        callback(null, saved.get(key) ?? null);
      });
    },
    setItem: (key, value, callback) => {
      queueMicrotask(() => {
        saved.set(key, value);
        callback(null, true);
      });
    },
  };
  vi.stubGlobal('Telegram', { WebApp: { isVersionAtLeast: () => true, DeviceStorage: device } });
  localStorage.setItem('user42', JSON.stringify(snapshot));
  expect(await loadOffline('user42')).toEqual(snapshot);
  expect(JSON.parse(saved.get('user42') ?? 'null')).toEqual(snapshot);
  const updated = { ...snapshot, changes: [] };
  expect(await saveOffline('user42', updated)).toBe(true);
  expect(await loadOffline('user42')).toEqual(updated);
});

it('does not fall back to an older browser copy after a DeviceStorage error', async () => {
  const device: DeviceStorage = {
    getItem: (_key, callback) => {
      callback('Unavailable');
    },
    setItem: (_key, _value, callback) => {
      callback('Unavailable', false);
    },
  };
  vi.stubGlobal('Telegram', { WebApp: { isVersionAtLeast: () => true, DeviceStorage: device } });
  localStorage.setItem('user42', JSON.stringify({ ...snapshot, changes: [] }));
  await expect(loadOffline('user42')).rejects.toThrow('Could not read saved data');
  expect(await saveOffline('user42', snapshot)).toBe(true);
  expect(await loadOffline('user42')).toEqual(snapshot);
  await expect(loadOffline('user43')).rejects.toThrow('Could not read saved data');
});

it('keeps the recovery copy authoritative when native storage starts working again', async () => {
  const setItem = vi.fn<DeviceStorage['setItem']>((_key, _value, callback) => {
    callback('QUOTA_EXCEEDED', false);
  });
  const device: DeviceStorage = {
    getItem: (_key, callback) => {
      callback(null, JSON.stringify({ ...snapshot, changes: [] }));
    },
    setItem,
  };
  vi.stubGlobal('Telegram', { WebApp: { isVersionAtLeast: () => true, DeviceStorage: device } });
  expect(await saveOffline('user42', snapshot)).toBe(true);
  expect(localStorage.getItem('user42')).toBeNull();
  expect(await loadOffline('user42')).toEqual(snapshot);
  setItem.mockImplementation((_key, _value, callback) => {
    callback(null, true);
  });
  const updated = { ...snapshot, changes: [] };
  expect(await saveOffline('user42', updated)).toBe(true);
  expect(await loadOffline('user42')).toEqual(updated);
  expect(setItem).toHaveBeenCalledTimes(1);
});

it('saves a recovery copy when Telegram never acknowledges a write', async () => {
  vi.useFakeTimers();
  const device: DeviceStorage = {
    getItem: (_key, callback) => {
      callback(null, null);
    },
    setItem: () => undefined,
  };
  vi.stubGlobal('Telegram', { WebApp: { isVersionAtLeast: () => true, DeviceStorage: device } });
  const saving = saveOffline('user42', snapshot);
  await vi.advanceTimersByTimeAsync(5000);
  expect(await saving).toBe(true);
  expect(await loadOffline('user42')).toEqual(snapshot);
});

it('reports failure when both native and browser writes fail', async () => {
  const device: DeviceStorage = {
    getItem: (_key, callback) => {
      callback(null, null);
    },
    setItem: () => {
      throw new Error('Unavailable');
    },
  };
  vi.stubGlobal('Telegram', { WebApp: { isVersionAtLeast: () => true, DeviceStorage: device } });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Full');
  });
  expect(await saveOffline('user42', snapshot)).toBe(false);
});

it('can start with DeviceStorage even when browser storage is unavailable', async () => {
  const device: DeviceStorage = {
    getItem: (_key, callback) => {
      callback(null, null);
    },
    setItem: (_key, _value, callback) => {
      callback(null, true);
    },
  };
  vi.stubGlobal('Telegram', { WebApp: { isVersionAtLeast: () => true, DeviceStorage: device } });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  expect(await loadOffline('user42')).toEqual(emptyOffline);
  expect(await saveOffline('user42', snapshot)).toBe(true);
});
