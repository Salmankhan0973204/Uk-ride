import { apiFetch } from '@/lib/api/client';
import type { BookingConfig, PlaceSuggestion, QuoteRequest, QuoteResult } from '../types';

/** Raw HTTP functions only. All public: no token. */
export const bookingApi = {
  config: (signal?: AbortSignal) => apiFetch<BookingConfig>('/config', { signal }),

  places: (text: string, signal?: AbortSignal) =>
    apiFetch<{ places: PlaceSuggestion[] }>(`/places?q=${encodeURIComponent(text)}`, { signal }),

  quote: (request: QuoteRequest, signal?: AbortSignal) =>
    apiFetch<QuoteResult>('/quotes', { method: 'POST', body: JSON.stringify(request), signal }),
};
