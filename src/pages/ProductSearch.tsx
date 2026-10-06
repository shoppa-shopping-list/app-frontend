import { Search, X } from 'lucide-react';
import styles from './ShoppingPage.module.scss';

interface ProductSearchProps {
  query: string;
  onChange: (query: string) => void;
}

export function ProductSearch({ query, onChange }: ProductSearchProps) {
  return (
    <div className={styles.search}>
      <Search size={16} aria-hidden="true" />
      <input
        aria-label="Search products"
        placeholder="Search products"
        value={query}
        maxLength={120}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {query.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
