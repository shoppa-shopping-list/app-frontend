import { baseApi } from '../../../shared/api/baseApi';
import type { TProduct } from '@/types/types';

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<TProduct[], void>({
      query: () => '/products',
      providesTags: ['ShoppingItem'],
    }),
  }),
});

export const { useGetProductsQuery } = productsApi;
