import { enhancedApi } from './generated';

export const shoppaApi = enhancedApi.enhanceEndpoints({
  endpoints: {
    getApiCatalog: { providesTags: ['Products'] },
    getApiShoppingList: { providesTags: ['Cart'] },
    putApiCatalogByProductId: { invalidatesTags: ['Products', 'Cart'] },
    deleteApiCatalogByProductId: { invalidatesTags: ['Products', 'Cart'] },
    putApiCatalogByProductIdFavourite: { invalidatesTags: ['Products'] },
    deleteApiCatalogByProductIdFavourite: { invalidatesTags: ['Products'] },
    putApiShoppingListByProductId: { invalidatesTags: ['Cart'] },
    deleteApiShoppingListByProductId: { invalidatesTags: ['Cart'] },
  },
});
export const {
  useGetApiCatalogQuery: useProductsQuery,
  useGetApiShoppingListQuery: useCartQuery,
  usePutApiCatalogByProductIdMutation: useSaveProductMutation,
  useDeleteApiCatalogByProductIdMutation: useDeleteProductMutation,
  usePutApiCatalogByProductIdFavouriteMutation: useFavouriteMutation,
  useDeleteApiCatalogByProductIdFavouriteMutation: useUnfavouriteMutation,
} = shoppaApi;
