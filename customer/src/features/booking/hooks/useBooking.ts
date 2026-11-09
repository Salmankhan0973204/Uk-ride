'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { bookingApi } from '../api/booking.api';
import type { BookingConfig, PlaceSuggestion, QuoteRequest, QuoteResult } from '../types';

/** The booking rules: Meet & Greet price, lead time, limits. Changes rarely. */
export function useBookingConfig() {
  return useQuery<BookingConfig, ApiError>({
    queryKey: queryKeys.booking.config(),
    queryFn: ({ signal }) => bookingApi.config(signal),
    staleTime: 60_000,
    retry: (count, error) => error.status >= 500 && count < 2,
  });
}

/** `value`, but only once it has stopped changing for `ms`: typing "heathrow" asks once, not eight times. */
export function useDebouncedValue<T>(value: T, ms: number) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

/** The fewest letters worth searching for. */
export const MIN_SEARCH_LENGTH = 3;

/**
 * Suggestions for an address box. `text` should already be debounced. The
 * previous suggestions stay on screen while the next ones load, so the list
 * does not flicker with every letter.
 */
export function usePlaceSuggestions(text: string) {
  const query = text.trim();
  return useQuery<{ places: PlaceSuggestion[] }, ApiError, PlaceSuggestion[]>({
    queryKey: queryKeys.booking.places(query.toLowerCase()),
    queryFn: ({ signal }) => bookingApi.places(query, signal),
    select: (data) => data.places,
    enabled: query.length >= MIN_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * The quote for the journey in the address. Each answer is saved on the
 * server as a quote of its own, so it is asked for once per journey and
 * never again behind the customer's back (no refetch on focus or reconnect).
 * "Get quote" on the same journey asks again on purpose, with `refetch`.
 */
export function useQuote(key: string, request: QuoteRequest | undefined) {
  return useQuery<QuoteResult, ApiError>({
    queryKey: queryKeys.booking.quote(key),
    queryFn: ({ signal }) => bookingApi.quote(request!, signal),
    enabled: request !== undefined,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (count, error) => error.status >= 500 && error.status !== 503 && count < 2,
  });
}
