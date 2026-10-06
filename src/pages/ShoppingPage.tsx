import { AnimatePresence } from 'motion/react';
import { CirclePlus, List, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { ProductRow } from '@/entities/product/ProductRow';
import { searchProducts } from '@/entities/product/model';
import { FrequentProducts } from './FrequentProducts';
import { ProductSearch } from './ProductSearch';
import { useShoppingProducts } from './useShoppingProducts';
import styles from './ShoppingPage.module.scss';

export function ShoppingPage({ cart = false }: { cart?: boolean }) {
  const [query, setQuery] = useState('');
  const { all, rows, frequent, pending, toggle, clearCart, hasPending } = useShoppingProducts(cart);
  const filtered = searchProducts(rows, query);
  const searchTerm = query.trim();
  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>{cart ? 'Cart' : 'Shoppa'}</h1>
          <Link
            to={cart ? '/' : '/cart'}
            className={styles.nav}
            aria-label={cart ? 'Back to list' : 'Open cart'}
          >
            {cart ? <List size={22} /> : <ShoppingCart size={22} />}
            {cart ? 'List' : 'Cart'}
          </Link>
        </header>
        {!cart && <ProductSearch query={query} onChange={setQuery} />}
        {!cart && searchTerm === '' && frequent.length > 0 && (
          <FrequentProducts products={frequent} pending={pending} onToggle={toggle} />
        )}
        {!cart && searchTerm !== '' && <h2 className={styles.matches}>Matches</h2>}
        <ul
          className={cart ? styles.cartRows : styles.rows}
          aria-label={cart ? 'Products in cart' : 'Products'}
        >
          <AnimatePresence initial={false}>
            {filtered.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                cart={cart}
                pending={pending[product.id]}
                onToggle={() => {
                  toggle(product);
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
        {!cart && searchTerm !== '' && (
          <>
            {filtered.length === 0 && <p className={styles.hint}>No products found.</p>}
            <Link className={styles.create} to={`/new?name=${encodeURIComponent(searchTerm)}`}>
              <CirclePlus size={22} />
              Create a new product
            </Link>
          </>
        )}
        {!cart && searchTerm === '' && rows.length === 0 && (
          <p className={styles.hint}>
            {all.length === 0
              ? 'Add your first product to get started.'
              : 'Everything is in your cart.'}
          </p>
        )}
        {cart && rows.length === 0 && (
          <div className={styles.empty}>
            <ShoppingCart size={48} strokeWidth={1.5} />
            <h2>Cart is empty</h2>
          </div>
        )}
        {!cart && searchTerm === '' && (
          <Link to="/new" className={styles.add} aria-label="Add product">
            <Plus size={26} />
          </Link>
        )}
        {cart && rows.length > 0 && (
          <button type="button" className={styles.clear} disabled={hasPending} onClick={clearCart}>
            Clear cart
          </button>
        )}
        <span id="undo-hint" className="sr-only">
          Tap this product again within three seconds to cancel.
        </span>
      </main>
      <Outlet />
    </>
  );
}
