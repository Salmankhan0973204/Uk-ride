'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { healthApi } from '../api/health.api';
import type { HealthData } from '../types';

export const HEALTH_REFETCH_MS = 10_000;

/**
 * Polls the API health endpoint.
 * Health data is always treated as stale and is re-checked on an interval,
 * so the screen recovers by itself when the backend comes back.
 */
export function useHealth() {
  return useQuery<HealthData, ApiError>({
    queryKey: queryKeys.health.status(),
    queryFn: ({ signal }) => healthApi.getHealth(signal),
    staleTime: 0,
    retry: 1,
    retryDelay: 1_000,
    refetchInterval: HEALTH_REFETCH_MS,
    refetchOnWindowFocus: true,
  });
}
