import { apiFetch } from '@/lib/api/client';
import type { QuoteRequest, QuoteResult } from '../types';

/** Raw HTTP functions only. Public: no token. */
export const quotesApi = {
  get: (request: QuoteRequest, signal?: AbortSignal) =>
    apiFetch<QuoteResult>('/quotes', { method: 'POST', body: JSON.stringify(request), signal }),
};
