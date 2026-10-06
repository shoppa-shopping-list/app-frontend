import { Star } from 'lucide-react';
import { COLORS } from '@/entities/product/model';
import type { Product } from '@/entities/product/model';
import type { TransfersState } from '@/features/transfers/transfersSlice';
import styles from './ShoppingPage.module.scss';

interface FrequentProductsProps {
  products: Product[];
  pending: TransfersState['pending'];
  onToggle: (product: Product) => void;
}

export function FrequentProducts({ products, pending, onToggle }: FrequentProductsProps) {
  return (
    <section aria-label="Frequent products">
      <h2 className={styles.sectionTitle}>
        <Star size={13} fill="currentColor" />
        Frequent
      </h2>
      <div className={styles.frequent}>
        {products.map((product) => (
          <button
            type="button"
            key={product.id}
            disabled={pending[product.id]?.phase === 'saving'}
            aria-label={
              pending[product.id]
                ? `Undo frequent ${product.name}`
                : `Add frequent ${product.name} to cart`
            }
            onClick={() => {
              onToggle(product);
            }}
          >
            <span style={{ backgroundColor: COLORS[product.color] }} />
            {product.name}
          </button>
        ))}
      </div>
    </section>
  );
}
