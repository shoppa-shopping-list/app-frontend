import { AlignLeft, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ColorPicker } from '@/entities/product/ColorPicker';
import type { Product, ProductColor } from '@/entities/product/model';
import {
  useProductsQuery,
  useSaveProductMutation,
  useFavouriteMutation,
  useUnfavouriteMutation,
} from '@/shared/api/api';
import styles from './ProductEditor.module.scss';

export function ProductForm() {
  const { productId } = useParams();
  const [params] = useSearchParams();
  const { data } = useProductsQuery({});
  const product = data?.products.find((item) => item.id === productId);
  if (productId && !product)
    return (
      <main className={styles.form}>
        <h1>Product unavailable</h1>
        <Link to="/">Back to list</Link>
      </main>
    );
  return (
    <Editor key={productId ?? 'new'} product={product} initialName={params.get('name') ?? ''} />
  );
}
function Editor({ product, initialName }: { product: Product | undefined; initialName: string }) {
  const [id] = useState(() => product?.id ?? crypto.randomUUID());
  const [name, setName] = useState(product?.name ?? initialName);
  const [color, setColor] = useState<ProductColor>(product?.color ?? 'none');
  const [frequent, setFrequent] = useState(product?.isFavourite ?? false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [save] = useSaveProductMutation();
  const [favourite] = useFavouriteMutation();
  const [unfavourite] = useUnfavouriteMutation();
  const { refetch } = useProductsQuery({});
  const navigate = useNavigate();
  const submit = async () => {
    if (busy || name.trim().length === 0) return;
    setBusy(true);
    setError('');
    try {
      await save({ productId: id, body: { name: name.trim(), color } }).unwrap();
      await (frequent ? favourite : unfavourite)({ productId: id }).unwrap();
      await refetch().unwrap();
      await navigate('/');
    } catch {
      setError('Could not save all changes. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <header className={styles.formHeader}>
        <Link to="/">Cancel</Link>
        <h1>{product ? 'Edit product' : 'New product'}</h1>
      </header>
      <label htmlFor="product-name" className={styles.label}>
        Name
      </label>
      <div className={styles.nameField}>
        <AlignLeft size={20} />
        <input
          id="product-name"
          aria-label="Product name"
          placeholder="Product name"
          value={name}
          maxLength={120}
          required
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      <h2 className={styles.label}>Color</h2>
      <ColorPicker value={color} onChange={setColor} />
      <h2 className={styles.label}>Options</h2>
      <button
        type="button"
        className={[styles.option, styles.frequent].join(' ')}
        aria-pressed={frequent}
        onClick={() => {
          setFrequent(!frequent);
        }}
      >
        <Star
          size={20}
          className={frequent ? styles.active : undefined}
          fill={frequent ? 'currentColor' : 'none'}
        />
        <span>Add to Frequent</span>
      </button>
      {error.length > 0 && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button
        className={[styles.primary, styles.submit].join(' ')}
        type="submit"
        disabled={busy || name.trim().length === 0}
      >
        {busy ? 'Saving…' : product ? 'Save changes' : 'Add to list'}
      </button>
    </form>
  );
}
