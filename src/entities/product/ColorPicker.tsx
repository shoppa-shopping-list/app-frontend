import { Check, Minus } from 'lucide-react';
import { COLORS, COLOR_ORDER } from './model';
import type { ProductColor } from './model';
import styles from './Product.module.scss';

export function ColorPicker({
  value,
  onChange,
}: {
  value: ProductColor;
  onChange: (color: ProductColor) => void;
}) {
  return (
    <div className={styles.colors} role="group" aria-label="Product color">
      {COLOR_ORDER.map((color) => (
        <button
          key={color}
          type="button"
          className={styles.swatch}
          aria-label={`${color === 'none' ? 'No' : color.charAt(0).toUpperCase() + color.slice(1)} color`}
          aria-pressed={value === color}
          onClick={() => {
            onChange(color);
          }}
        >
          <span
            style={{
              backgroundColor: COLORS[color],
              color: ['white', 'yellow', 'none'].includes(color) ? '#1c1c1e' : '#fff',
            }}
          >
            {value === color ? <Check size={20} /> : color === 'none' ? <Minus size={18} /> : null}
          </span>
        </button>
      ))}
    </div>
  );
}
