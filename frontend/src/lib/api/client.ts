import type { ApiEnvelope } from './types';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
).replace(/\/+$/, '');

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

/**
 * Calls the Express API and returns the `data` part of the envelope.
 * Every failure is converted to an ApiError, so hooks and components never
 * deal with raw fetch errors or response parsing.
 *
 * @param path Path after /api/v1, for example "/health".
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      cache: 'no-store',
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

  return body.data;
}
