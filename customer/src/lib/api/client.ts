import 'client-only';
import { createApiClient } from '@ukride/shared/api/client';

export { API_PREFIX, ApiError } from '@ukride/shared/api/client';

/**
 * The customer site's API client: customer sign-in, its own refresh address
 * and its own "signed in" hint. The admin panel has a separate one.
 *
 * `client-only` stops this file from ever running on the server, where the
 * access token kept inside the client would be shared between visitors.
 */
const client = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
  refreshPath: '/auth/refresh',
  hintKey: 'ukride_signed_in',
});

export const API_BASE_URL = client.apiBaseUrl;

export const { apiFetch, apiFetchWithMeta, authFetch, authFetchWithMeta, refreshAccessToken } =
  client;

export const { getAccessToken, setAccessToken, hasSessionHint, setSessionHint } = client.session;
