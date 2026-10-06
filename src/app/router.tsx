import { createBrowserRouter, Link } from 'react-router';
import { App } from './App';
import { ShoppingPage } from '@/pages/ShoppingPage';

export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: (
      <main className="gate">
        <h1>Something went wrong</h1>
        <p>Please reopen Shoppa to try again.</p>
        <a href="/">Reload Shoppa</a>
      </main>
    ),
    children: [
      {
        path: '/',
        element: <ShoppingPage />,
        children: [
          {
            path: 'products/:productId',
            lazy: async () => ({
              Component: (await import('@/features/product-editor/ProductDetails')).ProductDetails,
            }),
          },
        ],
      },
      { path: '/cart', element: <ShoppingPage cart /> },
      {
        path: '/new',
        lazy: async () => ({
          Component: (await import('@/features/product-editor/ProductForm')).ProductForm,
        }),
      },
      {
        path: '/edit/:productId',
        lazy: async () => ({
          Component: (await import('@/features/product-editor/ProductForm')).ProductForm,
        }),
      },
      {
        path: '*',
        element: (
          <main className="gate">
            <h1>Page not found</h1>
            <Link to="/">Back to list</Link>
          </main>
        ),
      },
    ],
  },
]);
