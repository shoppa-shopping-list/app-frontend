import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { getTelegram } from '@/shared/telegram/telegram';

const rawQuery = fetchBaseQuery({ baseUrl: '/', credentials: 'same-origin' });
let sessionRequest: Promise<Awaited<ReturnType<typeof rawQuery>>> | undefined;

const authenticatedQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawQuery(args, api, extraOptions);
  if (result.error?.status !== 401) return result;
  const initData = getTelegram()?.initData;
  if (!initData) return result;

  // Parallel initial queries share one handshake; credentials never enter Redux or storage.
  sessionRequest ??= Promise.resolve(
    rawQuery(
      { url: '/api/session', method: 'POST', headers: { Authorization: `tma ${initData}` } },
      api,
      extraOptions,
    ),
  ).finally(() => {
    sessionRequest = undefined;
  });
  const session = await sessionRequest;
  if (session.error) return { error: session.error };
  result = await rawQuery(args, api, extraOptions);
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: authenticatedQuery,
  tagTypes: ['Products', 'Cart'],
  endpoints: () => ({}),
});
