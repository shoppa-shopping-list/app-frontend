import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import { Star } from 'lucide-react';
import type { MotionStyle } from 'motion/react';
import { COLORS } from '@/entities/product/model';
import type { Product } from '@/entities/product/model';
import type { TransfersState } from '@/features/transfers/transfersSlice';
import styles from './ShoppingPage.module.scss';

interface FrequentProductsProps {
  products: Product[];
  pending: TransfersState['pending'];
  onToggle: (product: Product) => void;
}

const FRAGMENTS = Array.from({ length: 70 }, (_, index) => {
  const column = index % 14;
  const row = Math.floor(index / 14);
  return {
    clipPath: `inset(${row * 20}% ${100 - ((column + 1) * 100) / 14}% ${80 - row * 20}% ${(column * 100) / 14}%)`,
    x: (column - 6.5) * 3 + Math.sin(index * 2.4) * 12,
    y: 14 + row * 5 + ((index * 13) % 23),
    rotate: ((index * 17) % 41) - 20,
    delay: (13 - column) * 0.012 + row * 0.015,
  };
});

function FrequentChip({
  product,
  pending,
  onToggle,
}: {
  product: Product;
  pending: TransfersState['pending'][string];
  onToggle: (product: Product) => void;
}) {
  const present = useIsPresent();
  const reduceMotion = useReducedMotion();
  const contents = (
    <>
      <span className={styles.frequentDot} />
      {product.name}
    </>
  );
  return (
    <motion.div
      className={styles.frequentChip}
      style={{ '--product-color': COLORS[product.color] } as MotionStyle}
      layout={!reduceMotion}
      initial={false}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { delay: reduceMotion ? 0 : 0.82, duration: 0.12 },
        layout: { duration: 0.25 },
      }}
    >
      <motion.button
        className={styles.frequentFace}
        initial={false}
        animate={{ opacity: !present && !reduceMotion ? 0 : pending ? 0.55 : 1 }}
        transition={{ duration: present ? 0.25 : 0 }}
        type="button"
        disabled={!present || pending?.phase === 'saving'}
        aria-label={
          pending ? `Undo frequent ${product.name}` : `Add frequent ${product.name} to cart`
        }
        onClick={() => {
          onToggle(product);
        }}
      >
        {contents}
      </motion.button>
      {!present && !reduceMotion && (
        <span className={styles.fragments} aria-hidden="true" data-testid="favourite-fragments">
          {FRAGMENTS.map((fragment, index) => (
            <motion.span
              key={index}
              className={styles.frequentFace}
              style={{ clipPath: fragment.clipPath }}
              initial={{ opacity: pending ? 0.55 : 1, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, x: fragment.x, y: fragment.y, rotate: fragment.rotate }}
              transition={{ duration: 0.6, delay: fragment.delay, ease: 'easeIn' }}
            >
              {contents}
            </motion.span>
          ))}
        </span>
      )}
    </motion.div>
  );
}

export function FrequentProducts({ products, pending, onToggle }: FrequentProductsProps) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {products.length > 0 && (
        <motion.section
          exit={{ opacity: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.82, duration: 0.12 }}
          aria-label="Frequent products"
        >
          <h2 className={styles.sectionTitle}>
            <Star size={13} fill="currentColor" />
            Frequent
          </h2>
          <div className={styles.frequent}>
            <AnimatePresence initial={false} propagate>
              {products.map((product) => (
                <FrequentChip
                  key={product.id}
                  product={product}
                  pending={pending[product.id]}
                  onToggle={onToggle}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
