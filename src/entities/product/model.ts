import type {
  GetApiCatalogApiResponse,
  GetApiShoppingListApiResponse,
} from '@/shared/api/generated';

export type Product = GetApiCatalogApiResponse['products'][number];
export type CartItem = GetApiShoppingListApiResponse['items'][number];
export type ProductColor = Product['color'];
export const COLORS: Record<ProductColor, string> = {
  red: '#ff2d55',
  orange: '#ff9500',
  yellow: '#ffcc00',
  green: '#34c759',
  blue: '#007aff',
  purple: '#af52de',
  brown: '#a2845e',
  black: '#1c1c1e',
  white: '#ffffff',
  none: '#c7c7cc',
};
export const COLOR_ORDER = Object.keys(COLORS) as ProductColor[];
export function visibleProducts(products: Product[], items: CartItem[], cart: boolean): Product[] {
  const ids = new Set(items.map((item) => item.productId));
  return products.filter((product) => ids.has(product.id) === cart);
}
export function searchProducts(products: Product[], query: string): Product[] {
  const needle = query.trim().toLocaleLowerCase('en');
  return products.filter((product) => product.name.toLocaleLowerCase('en').includes(needle));
}
