import { createBrowserRouter } from 'react-router';

import { RootLayout } from './layouts/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CartPage } from '@/pages/CartPage';
import { EmptyPage } from '@/pages/EmptyPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
        handle: {
          title: 'Home',
        },
      },
      {
        path: 'shopping-list',
        element: <ProductsPage />,
        handle: {
          title: 'My Shopping List',
        },
      },
      {
        path: 'cart',
        element: <CartPage />,
        handle: [],
      },
      {
        path: 'empty',
        element: <EmptyPage />,
        handle: {
          title: 'There s empty',
        },
      },
      {
        path: '*',
        element: <NotFoundPage />,
        handle: {
          title: 'Not found',
        },
      },
    ],
  },
]);
