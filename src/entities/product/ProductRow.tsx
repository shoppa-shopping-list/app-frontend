import { EllipsisVertical } from 'lucide-react';
import { motion } from 'motion/react';
import type { MotionStyle } from 'motion/react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
interface Transfer {
  token: string;
  startedAt: number;
  phase: 'waiting' | 'saving';
}
import { UNDO_MS } from '@/shared/config/behavior';
import { COLORS } from './model';
import type { Product } from './model';
import styles from './Product.module.scss';

interface RowProps {
  product: Product;
  pending?: Transfer | undefined;
  cart: boolean;
  onToggle: () => void;
}
function Sweep({ transfer, name }: { transfer: Transfer; name: string }) {
  const [mountedAt] = useState(() => Date.now());
  return (
    <span
      className={styles.sweep}
      aria-hidden="true"
      style={
        {
          '--elapsed': `${-Math.min(UNDO_MS, Math.max(0, mountedAt - transfer.startedAt))}ms`,
          '--duration': `${UNDO_MS}ms`,
        } as CSSProperties
      }
    >
      <span className={styles.struck}>{name}</span>
    </span>
  );
}
export function ProductRow({ product, pending, cart, onToggle }: RowProps) {
  const label =
    pending?.phase === 'waiting'
      ? `Undo move of ${product.name}`
      : pending?.phase === 'saving'
        ? `Saving ${product.name}`
        : cart
          ? `Remove ${product.name} from cart`
          : `Add ${product.name} to cart`;
  return (
    <motion.li
      layout
      initial={false}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.row}
      style={{ '--product-color': COLORS[product.color] } as MotionStyle}
    >
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.move}
          data-pending={pending !== undefined}
          onClick={onToggle}
          aria-label={label}
          aria-describedby={pending?.phase === 'waiting' ? 'undo-hint' : undefined}
          disabled={pending?.phase === 'saving'}
        >
          <span className={styles.dot} />
          <span className={styles.name}>{product.name}</span>
          {pending && <Sweep key={pending.token} transfer={pending} name={product.name} />}
        </button>
        {!cart && (
          <Link
            to={`/products/${product.id}`}
            className={styles.details}
            aria-label={`View details for ${product.name}`}
          >
            <EllipsisVertical size={22} />
          </Link>
        )}
      </div>
    </motion.li>
  );
}
