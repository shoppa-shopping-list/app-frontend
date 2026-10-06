import { baseApi as api } from './baseApi';
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiCatalog: build.query<GetApiCatalogApiResponse, GetApiCatalogApiArg>({
      query: (queryArg) => ({
        url: `/api/catalog`,
        params: {
          name: queryArg.name,
        },
      }),
    }),
    putApiCatalogByProductId: build.mutation<
      PutApiCatalogByProductIdApiResponse,
      PutApiCatalogByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/${queryArg.productId}`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
    deleteApiCatalogByProductId: build.mutation<
      DeleteApiCatalogByProductIdApiResponse,
      DeleteApiCatalogByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/${queryArg.productId}`,
        method: 'DELETE',
      }),
    }),
    putApiCatalogByProductIdFavourite: build.mutation<
      PutApiCatalogByProductIdFavouriteApiResponse,
      PutApiCatalogByProductIdFavouriteApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/${queryArg.productId}/favourite`,
        method: 'PUT',
      }),
    }),
    deleteApiCatalogByProductIdFavourite: build.mutation<
      DeleteApiCatalogByProductIdFavouriteApiResponse,
      DeleteApiCatalogByProductIdFavouriteApiArg
    >({
      query: (queryArg) => ({
        url: `/api/catalog/${queryArg.productId}/favourite`,
        method: 'DELETE',
      }),
    }),
    getApiShoppingList: build.query<GetApiShoppingListApiResponse, GetApiShoppingListApiArg>({
      query: () => ({ url: `/api/shopping-list` }),
    }),
    putApiShoppingListByProductId: build.mutation<
      PutApiShoppingListByProductIdApiResponse,
      PutApiShoppingListByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/shopping-list/${queryArg.productId}`,
        method: 'PUT',
      }),
    }),
    deleteApiShoppingListByProductId: build.mutation<
      DeleteApiShoppingListByProductIdApiResponse,
      DeleteApiShoppingListByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/shopping-list/${queryArg.productId}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as enhancedApi };
export type GetApiCatalogApiResponse = /** status 200 Default Response */ {
  products: {
    color:
      | 'red'
      | 'orange'
      | 'yellow'
      | 'green'
      | 'blue'
      | 'purple'
      | 'brown'
      | 'black'
      | 'white'
      | 'none';
    createdAt: string;
    defaultUnit?: string;
    id: string;
    name: string;
    isFavourite: boolean;
  }[];
};
export type GetApiCatalogApiArg = {
  name?: string;
};
export type PutApiCatalogByProductIdApiResponse = /** status 200 Default Response */ {
  color:
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'purple'
    | 'brown'
    | 'black'
    | 'white'
    | 'none';
  createdAt: string;
  defaultUnit?: string;
  id: string;
  name: string;
};
export type PutApiCatalogByProductIdApiArg = {
  productId: string;
  body: {
    color?:
      | 'red'
      | 'orange'
      | 'yellow'
      | 'green'
      | 'blue'
      | 'purple'
      | 'brown'
      | 'black'
      | 'white'
      | 'none';
    defaultUnit?: string;
    name: string;
  };
};
export type DeleteApiCatalogByProductIdApiResponse = /** status 204 Default Response */ void;
export type DeleteApiCatalogByProductIdApiArg = {
  productId: string;
};
export type PutApiCatalogByProductIdFavouriteApiResponse = /** status 204 Default Response */ void;
export type PutApiCatalogByProductIdFavouriteApiArg = {
  productId: string;
};
export type DeleteApiCatalogByProductIdFavouriteApiResponse =
  /** status 204 Default Response */ void;
export type DeleteApiCatalogByProductIdFavouriteApiArg = {
  productId: string;
};
export type GetApiShoppingListApiResponse = /** status 200 Default Response */ {
  items: {
    addedAt: string;
    addedBy: number;
    color:
      | 'red'
      | 'orange'
      | 'yellow'
      | 'green'
      | 'blue'
      | 'purple'
      | 'brown'
      | 'black'
      | 'white'
      | 'none';
    name: string;
    productId: string;
  }[];
};
export type GetApiShoppingListApiArg = void;
export type PutApiShoppingListByProductIdApiResponse = /** status 200 Default Response */ {
  addedAt: string;
  addedBy: number;
  color:
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'purple'
    | 'brown'
    | 'black'
    | 'white'
    | 'none';
  name: string;
  productId: string;
};
export type PutApiShoppingListByProductIdApiArg = {
  productId: string;
};
export type DeleteApiShoppingListByProductIdApiResponse = /** status 204 Default Response */ void;
export type DeleteApiShoppingListByProductIdApiArg = {
  productId: string;
};
export const {
  useGetApiCatalogQuery,
  usePutApiCatalogByProductIdMutation,
  useDeleteApiCatalogByProductIdMutation,
  usePutApiCatalogByProductIdFavouriteMutation,
  useDeleteApiCatalogByProductIdFavouriteMutation,
  useGetApiShoppingListQuery,
  usePutApiShoppingListByProductIdMutation,
  useDeleteApiShoppingListByProductIdMutation,
} = injectedRtkApi;
