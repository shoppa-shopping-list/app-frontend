import { useGetProductsQuery } from '../features/products/api/productsApi';
import { ProductCardUI } from '@/ui/ProductCardUI';
import { useState } from 'react';
import productsData from '../data/mockProducts.json';
import type { TProduct, TUpdates } from '@/types/types';

export function ProductsPage() {
  const { isLoading, isError } = useGetProductsQuery();
  // const { data: products, isLoading, isError } = useGetProductsQuery();

  const [prod, setProducts] = useState<TProduct[]>(productsData as TProduct[]);
  // const [prod, setProducts] = useState<TProduct[]>(products); // по идее должно быть так, когда сервер будет

  const updateProduct = (productId: number, updates: TUpdates) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId ? { ...product, ...updates } : product,
      ),
    );
  };

  if (isLoading) {
    return <p>Загрузка товаров...</p>;
  }

  if (isError) {
    return <p>Не удалось загрузить товары.</p>;
  }

  return (
    <section>
      <h1>Товары</h1>

      <ul>
        {prod?.map((product) => (
          <li key={product.id}>
            <ProductCardUI
              product={product}
              onClick={() =>
                updateProduct(product.id, {
                  status: product.status === 'catalog' ? 'cart' : 'catalog',
                })
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
