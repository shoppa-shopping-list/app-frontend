import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { Product } from '@/entities/product/model';
import { productsWithTransfers } from '@/features/transfers/productsWithTransfers';
import { transfers } from '@/features/transfers/transfersSlice';
import { useProductsQuery, useCartQuery } from '@/shared/api/api';

export function useShoppingProducts(cart: boolean) {
  const { data: products } = useProductsQuery({});
  const { data: basket } = useCartQuery();
  const pending = useAppSelector((state) => state.transfers.pending);
  const dispatch = useAppDispatch();
  const all = products?.products ?? [];
  const rows = productsWithTransfers(all, basket?.items ?? [], pending, cart);
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
