import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { Product } from '@/entities/product/model';
import { productsWithTransfers } from '@/features/transfers/productsWithTransfers';
import { transfers } from '@/features/transfers/transfersSlice';
import { useProductsQuery, useCartQuery } from '@/shared/api/api';

export function useShoppingProducts(cart: boolean) {
  const { data: products } = useProductsQuery({});
  const { data: basket } = useCartQuery();
  const pending = useAppSelector((state) => state.transfers.pending);
  const snapshot = useAppSelector((state) => state.offline);
  const dispatch = useAppDispatch();
  const all = products?.products ?? snapshot.products ?? [];
  const items = (snapshot.items ?? basket?.items ?? []).filter(
    (item) => !snapshot.changes.some((change) => change.productId === item.productId),
  );
  for (const change of snapshot.changes) {
    const product = all.find((entry) => entry.id === change.productId);
    if (change.toCart && product)
      items.push({
        productId: product.id,
        name: product.name,
        color: product.color,
        addedAt: '',
        addedBy: 0,
      });
  }
  const rows = productsWithTransfers(all, items, pending, cart);
  const frequent = rows.filter((product) => product.isFavourite);
  const toggle = (product: Product) => {
    if (pending[product.id]) dispatch(transfers.cancelled(product.id));
    else
      dispatch(transfers.requested({ productId: product.id, name: product.name, toCart: !cart }));
  };
  const clearCart = () => {
    for (const product of rows) {
      dispatch(transfers.requested({ productId: product.id, name: product.name, toCart: false }));
    }
  };
  return {
    all,
    rows,
    frequent,
    pending,
    toggle,
    clearCart,
    hasPending: Object.values(pending).some(Boolean),
  };
}
