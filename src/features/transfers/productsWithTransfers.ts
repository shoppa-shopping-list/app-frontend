import { visibleProducts } from '@/entities/product/model';
import type { CartItem, Product } from '@/entities/product/model';
import type { TransfersState } from './transfersSlice';

export function productsWithTransfers(
  products: Product[],
  items: CartItem[],
  pending: TransfersState['pending'],
  cart: boolean,
): Product[] {
  const visibleIds = new Set(visibleProducts(products, items, cart).map((product) => product.id));
  return products.filter((product) => {
    const transfer = pending[product.id];
    // Keep the row on its original screen until the local transfer settles,
    // even when an SSE update has already changed the server's cart.
    return transfer ? transfer.toCart !== cart : visibleIds.has(product.id);
  });
}
