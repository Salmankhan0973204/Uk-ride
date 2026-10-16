import type { ApiEnvelope, ApiSuccessEnvelope } from './types';

export const API_PREFIX = '/api/v1';

/**
 * The single error shape the UI has to handle.
 * status 0 means the request never reached the API (offline, CORS, DNS).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export interface ApiClientConfig {
  /** Where the API lives, without /api/v1: "http://localhost:4000". */
  baseUrl: string;
  /** Path after /api/v1 that swaps the refresh cookie for an access token. */
  refreshPath: string;
  /**
   * localStorage key for the "this browser signed in at some point" hint.
   * Each app has its own, because each app has its own sign-in.
   */
  hintKey: string;
}

/**
 * Builds the API client of one app. The customer site and the admin panel
 * each make one, with their own refresh address and hint, so the two
 * sign-ins never touch each other.
 *
 * Everything returned is meant for the browser: the access token lives in a
 * variable of this client, in memory only. A page reload loses it, which is
 * fine, because the refresh cookie gets a new one. It is never written to
 * localStorage, where any script on the page could read it.
 */
export function createApiClient({ baseUrl, refreshPath, hintKey }: ApiClientConfig) {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '');

  // ---- the session held by this client

  let accessToken: string | null = null;

  const getAccessToken = () => accessToken;

  function setAccessToken(token: string | null) {
    accessToken = token;
  }

  /**
   * A hint, not a credential. The real proof is the httpOnly refresh cookie,
   * which scripts cannot see. Without the hint, a visitor who never signed in
   * would trigger a failed refresh request on every page load.
   */
  function hasSessionHint() {
    try {
      return window.localStorage.getItem(hintKey) === '1';
    } catch {
      // Storage can be blocked (private mode, settings). Then just try a refresh.
      return true;
    }
  }

  function setSessionHint(signedIn: boolean) {
    try {
      if (signedIn) window.localStorage.setItem(hintKey, '1');
      else window.localStorage.removeItem(hintKey);
    } catch {
      // Nothing to do: the hint is only an optimisation.
    }
  }

  // ---- requests

  /** Sends the request and checks the envelope. */
  async function request<T>(path: string, init: RequestInit): Promise<ApiSuccessEnvelope<T>> {
    let response: Response;

    try {
      response = await fetch(`${apiBaseUrl}${API_PREFIX}${path}`, {
        ...init,
        cache: 'no-store',
        // Lets the browser store and send the httpOnly refresh cookie, which the
        // API sets on a different port from the web app.
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers,
        },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the API. It may be offline.');
    }

    let body: ApiEnvelope<T>;
    try {
      body = (await response.json()) as ApiEnvelope<T>;
    } catch {
      throw new ApiError(
        response.status,
        'INVALID_RESPONSE',
        'The API returned a response that could not be read.',
      );
    }

    if (!response.ok || !body.success) {
      if (body && body.success === false) {
        throw new ApiError(
          response.status,
          body.error.code,
          body.error.message,
          body.error.details,
          body.requestId,
        );
      }
      throw new ApiError(response.status, 'UNEXPECTED_RESPONSE', 'The API request failed.');
    }

    return body;
  }

  /**
   * Calls the API and returns the `data` part of the envelope. Every failure
   * is an ApiError, so hooks and components never handle raw fetch errors.
   *
   * @param path Path after /api/v1, for example "/health".
   */
  async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    return (await request<T>(path, init)).data;
  }

  /** The whole success envelope, for answers that carry `meta` beside `data`. */
  function apiFetchWithMeta<T>(path: string, init: RequestInit = {}) {
    return request<T>(path, init);
  }

  /** The error used when there is no session to act on. */
  const signedOut = () => new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue');

  /**
   * Asks the API for a new access token using the refresh cookie.
   *
   * Each refresh token works once, so two refreshes at the same moment would
   * make the second one fail. `pending` makes every caller in this tab share
   * one request.
   */
  let pending: Promise<string> | null = null;

  function refreshAccessToken(): Promise<string> {
    pending ??= apiFetch<{ accessToken: string }>(refreshPath, { method: 'POST' })
      .then(({ accessToken: token }) => {
        setAccessToken(token);
        setSessionHint(true);
        return token;
      })
      .catch((error: unknown) => {
        // Only a real "no" from the API ends the session. If the API is merely
        // unreachable, the hint stays so the next page load tries again.
        if (error instanceof ApiError && error.status === 401) {
          setAccessToken(null);
          setSessionHint(false);
        }
        throw error;
      })
      .finally(() => {
        pending = null;
      });

    return pending;
  }

  /** Runs `call` with the access token, refreshing it once when missing or expired. */
  async function withAccessToken<R>(call: (headers: { Authorization: string }) => Promise<R>) {
    const send = (token: string) => call({ Authorization: `Bearer ${token}` });

    let token = getAccessToken();
    if (!token) {
      if (!hasSessionHint()) throw signedOut();
      token = await refreshAccessToken();
      return send(token);
    }

    try {
      return await send(token);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      return send(await refreshAccessToken());
    }
  }

  /**
   * apiFetch for routes that need a signed-in user. It adds the access token,
   * and when the token is missing (after a reload) or expired, it gets a new
   * one and tries once more. The caller sees a 401 only when the session is
   * really over.
   */
  function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    return withAccessToken((headers) =>
      apiFetch<T>(path, { ...init, headers: { ...init.headers, ...headers } }),
    );
  }

  /** authFetch that returns the whole envelope, `meta` included. */
  function authFetchWithMeta<T>(path: string, init: RequestInit = {}) {
    return withAccessToken((headers) =>
      apiFetchWithMeta<T>(path, { ...init, headers: { ...init.headers, ...headers } }),
    );
  }

  return {
    apiBaseUrl,
    apiFetch,
    apiFetchWithMeta,
    authFetch,
    authFetchWithMeta,
    refreshAccessToken,
    session: { getAccessToken, setAccessToken, hasSessionHint, setSessionHint },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
