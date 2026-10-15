'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { quotesApi } from '../api/quotes.api';
import type { QuoteRequest, QuoteResult } from '../types';

/**
 * Prices a journey once the form has been sent.
 *
 * A query, not a mutation, although the request is a POST: asking for a
 * price changes nothing, and the same question has the same answer. As a
 * query it is cached by its question, and an admin saving new prices makes
 * it stale (`quotes.all`), so the next look is fresh.
 *
 * `request` is undefined until the form is sent; `enabled` waits for it.
 */
export function useQuote(request: QuoteRequest | undefined) {
  return useQuery<QuoteResult, ApiError>({
    queryKey: [...queryKeys.quotes.all, request],
    queryFn: ({ signal }) => quotesApi.get(request!, signal),
    enabled: request !== undefined,
    placeholderData: keepPreviousData,
    // A price can change at any time: never show an old one without asking.
    staleTime: 0,
    retry: (count, error) => error.status >= 500 && count < 2,
  });
}
