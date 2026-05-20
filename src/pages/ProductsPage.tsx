import { useGetProductsQuery } from '../features/products/api/productsApi';

export function ProductsPage() {
  const { data: products, isLoading, isError } = useGetProductsQuery();

  if (isLoading) {
    return <p>Загрузка товаров...</p>;
  }

  if (isError) {
    return <p>Не удалось загрузить товары.</p>;
  }

  return (
    <section>
      <h1>Товары</h1>

      <ul>
        {products?.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </section>
  );
}
