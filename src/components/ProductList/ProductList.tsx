import { useState } from 'react';
import productsData from '../../data/mockProducts.json';
import type { TProduct, TUpdates } from '@/types/types';
import { ProductCardUI } from '@/ui/ProductCardUI';

export const ProductContainer = () => {
  const [products, setProducts] = useState<TProduct[]>(productsData as TProduct[]);

  const updateProduct = (productId: number, updates: TUpdates) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId ? { ...product, ...updates } : product,
      ),
    );
  };

  return (
    <div>
      {products.map((product) => (
        <ProductCardUI
          key={product.id}
          product={product}
          onClick={() =>
            updateProduct(product.id, {
              status: product.status === 'catalog' ? 'cart' : 'catalog',
            })
          }
        />
      ))}
    </div>
  );
};
