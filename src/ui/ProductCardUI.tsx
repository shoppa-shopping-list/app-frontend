import type { TProduct } from '@/types/types';
import type React from 'react';

interface TProductCard {
  product: TProduct;
  onClick: () => void;
}

export const ProductCardUI: React.FC<TProductCard> = ({ product, onClick }) => {
  return (
    <button onClick={onClick}>
      <h3>{product.name}</h3>
    </button>
  );
};
