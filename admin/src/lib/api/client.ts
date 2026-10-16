import 'client-only';
import { createApiClient } from '@ukride/shared/api/client';

export { API_PREFIX, ApiError } from '@ukride/shared/api/client';

/**
 * The admin panel's API client. It signs in through the staff endpoints
 * (`/admin/auth/*`), whose refresh cookie and token audience are separate
 * from the customer site's, so the two sign-ins never interfere.
 *
 * `client-only` stops this file from ever running on the server, where the
 * access token kept inside the client would be shared between visitors.
 */
const client = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
  refreshPath: '/admin/auth/refresh',
  hintKey: 'ukride_staff_signed_in',
});

export const API_BASE_URL = client.apiBaseUrl;

export const { apiFetch, apiFetchWithMeta, authFetch, authFetchWithMeta, refreshAccessToken } =
  client;

export const { getAccessToken, setAccessToken, hasSessionHint, setSessionHint } = client.session;
