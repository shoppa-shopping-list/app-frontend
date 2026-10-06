import { ChevronLeft, ChevronRight, Pencil, Star, Tag } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ColorPicker } from '@/entities/product/ColorPicker';
import { COLORS } from '@/entities/product/model';
import type { ProductColor } from '@/entities/product/model';
import {
  useProductsQuery,
  useDeleteProductMutation,
  useSaveProductMutation,
  useFavouriteMutation,
  useUnfavouriteMutation,
} from '@/shared/api/api';
import { Sheet } from '@/shared/ui/Sheet';
import styles from './ProductEditor.module.scss';

export function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data, refetch } = useProductsQuery({});
  const product = data?.products.find((item) => item.id === productId);
  const [screen, setScreen] = useState<'details' | 'color' | 'delete'>('details');
  const [color, setColor] = useState<ProductColor | undefined>();
  const [error, setError] = useState('');
  const [remove, removal] = useDeleteProductMutation();
  const [save, saving] = useSaveProductMutation();
  const [favourite, adding] = useFavouriteMutation();
  const [unfavourite, subtracting] = useUnfavouriteMutation();
  const busy = removal.isLoading || saving.isLoading || adding.isLoading || subtracting.isLoading;
  const close = () => {
    void navigate('/');
  };
  const run = async (operation: () => Promise<unknown>, after?: () => void) => {
    setError('');
    try {
      await operation();
      await refetch().unwrap();
      after?.();
    } catch {
      setError('Could not save your changes. Please try again.');
    }
  };
  return (
    <Sheet
      title={
        screen === 'color'
          ? 'Color'
          : screen === 'delete'
            ? 'Delete product?'
            : (product?.name ?? 'Product unavailable')
      }
      onClose={close}
    >
      {error.length > 0 && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!product ? (
        <p className={styles.copy}>This product is no longer in your list.</p>
      ) : (
        <>
          {screen === 'details' && (
            <>
              <div className={styles.options}>
                <button
                  type="button"
                  className={styles.option}
                  onClick={() => {
                    setColor(product.color);
                    setScreen('color');
                  }}
                >
                  <Tag size={20} />
                  <span>Color</span>
                  <i
                    className={styles.colorDot}
                    style={{ backgroundColor: COLORS[product.color] }}
                  />
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className={styles.option}
                  aria-pressed={product.isFavourite}
                  disabled={busy}
                  onClick={() => {
                    void run(() =>
                      (product.isFavourite ? unfavourite : favourite)({
                        productId: product.id,
                      }).unwrap(),
                    );
                  }}
                >
                  <Star
                    size={20}
                    className={product.isFavourite ? styles.active : undefined}
                    fill={product.isFavourite ? 'currentColor' : 'none'}
                  />
                  <span>Frequent</span>
                </button>
                <Link className={styles.option} to={`/edit/${product.id}`}>
                  <Pencil size={20} />
                  <span>Edit name</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
              <button
                type="button"
                className={styles.delete}
                onClick={() => {
                  setScreen('delete');
                }}
              >
                Delete product
              </button>
            </>
          )}
          {screen === 'color' && (
            <>
              <button
                type="button"
                className={styles.back}
                onClick={() => {
                  setScreen('details');
                }}
              >
                <ChevronLeft size={20} />
                Back to details
              </button>
              <ColorPicker value={color ?? product.color} onChange={setColor} />
              <button
                type="button"
                className={styles.primary}
                disabled={busy}
                onClick={() => {
                  void run(
                    () =>
                      save({
                        productId: product.id,
                        body: { name: product.name, color: color ?? product.color },
                      }).unwrap(),
                    () => {
                      setScreen('details');
                    },
                  );
                }}
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
          {screen === 'delete' && (
            <>
              <p className={styles.copy}>
                Delete {product.name} from the list and cart for both of you?
              </p>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={busy}
                onClick={() => {
                  void run(() => remove({ productId: product.id }).unwrap(), close);
                }}
              >
                {busy ? 'Deleting…' : 'Delete product'}
              </button>
              <button
                type="button"
                className={styles.secondary}
                disabled={busy}
                onClick={() => {
                  setScreen('details');
                }}
              >
                Keep product
              </button>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
