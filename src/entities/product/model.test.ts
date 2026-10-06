import { describe, expect, it } from 'vitest';
import { searchProducts, visibleProducts } from './model';
import type { CartItem, Product } from './model';
const cheese: Product = {
  id: 'cheese',
  name: 'Cheese',
  color: 'yellow',
  isFavourite: true,
  createdAt: '2026-01-01T00:00:00Z',
};
const milk: Product = { ...cheese, id: 'milk', name: 'Milk' };
const cart: CartItem[] = [
  {
    productId: 'cheese',
    name: 'Cheese',
    color: 'yellow',
    addedAt: '2026-01-01T00:00:00Z',
    addedBy: 42,
  },
];
describe('product visibility', () => {
  it('partitions the shared products into list and cart without deleting products', () => {
    const products = [cheese, milk];
    expect(visibleProducts(products, cart, false)).toEqual([milk]);
    expect(visibleProducts(products, cart, true)).toEqual([cheese]);
    expect(visibleProducts(products, [], false)).toEqual(products);
    expect(products).toHaveLength(2);
  });
  it('searches case-insensitively, trims whitespace, and handles no matches', () => {
    expect(searchProducts([cheese, milk], '  CHEE ')).toEqual([cheese]);
    expect(searchProducts([cheese, milk], ' ')).toEqual([cheese, milk]);
    expect(searchProducts([cheese, milk], 'bread')).toEqual([]);
  });
});
