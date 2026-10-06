import { describe, expect, it } from 'vitest';
import type { CartItem, Product } from '@/entities/product/model';
import { productsWithTransfers } from './productsWithTransfers';
import type { Transfer } from './transfersSlice';

const cheese: Product = {
  id: 'cheese',
  name: 'Cheese',
  color: 'yellow',
  isFavourite: true,
  createdAt: '2026-01-01T00:00:00Z',
};
const milk: Product = { ...cheese, id: 'milk', name: 'Milk' };
const cartItem: CartItem = {
  productId: cheese.id,
  name: cheese.name,
  color: cheese.color,
  addedAt: cheese.createdAt,
  addedBy: 42,
};
const transfer: Transfer = {
  productId: cheese.id,
  name: cheese.name,
  toCart: true,
  token: 'transfer-token',
  startedAt: 0,
  phase: 'waiting',
};

describe('product visibility during transfers', () => {
  it('uses server membership when no local transfer is active and preserves product order', () => {
    const products = [cheese, milk];
    expect(productsWithTransfers(products, [], {}, false)).toEqual(products);
    expect(productsWithTransfers(products, [cartItem], { cheese: undefined }, false)).toEqual([
      milk,
    ]);
    expect(productsWithTransfers(products, [cartItem], {}, true)).toEqual([cheese]);
  });

  it.each(['waiting', 'saving'] as const)(
    'keeps a product in the list during %s even after the server adds it to the cart',
    (phase) => {
      const pending = { cheese: { ...transfer, phase } };
      expect(productsWithTransfers([cheese, milk], [cartItem], pending, false)).toEqual([
        cheese,
        milk,
      ]);
      expect(productsWithTransfers([cheese, milk], [cartItem], pending, true)).toEqual([]);
    },
  );

  it('keeps a returning product in the cart until its local transfer settles', () => {
    const pending = { cheese: { ...transfer, toCart: false } };
    expect(productsWithTransfers([cheese, milk], [], pending, true)).toEqual([cheese]);
    expect(productsWithTransfers([cheese, milk], [], pending, false)).toEqual([milk]);
    expect(productsWithTransfers([cheese, milk], [], {}, true)).toEqual([]);
    expect(productsWithTransfers([cheese, milk], [], {}, false)).toEqual([cheese, milk]);
  });

  it('does not resurrect a product deleted on the server during a transfer', () => {
    expect(productsWithTransfers([milk], [cartItem], { cheese: transfer }, false)).toEqual([milk]);
    expect(productsWithTransfers([], [], { cheese: transfer }, true)).toEqual([]);
  });
});
