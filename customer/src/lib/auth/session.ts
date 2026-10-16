/**
 * Where the browser keeps what it knows about being signed in: the access
 * token (in memory only) and the "signed in at some point" hint. Both belong
 * to the customer site's API client; see `@/lib/api/client`.
 */
export { getAccessToken, hasSessionHint, setAccessToken, setSessionHint } from '@/lib/api/client';
