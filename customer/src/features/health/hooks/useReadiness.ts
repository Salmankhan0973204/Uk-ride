'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { healthApi } from '../api/health.api';
import type { ReadinessData } from '../types';
import { HEALTH_REFETCH_MS } from './useHealth';

/**
 * Polls the API readiness endpoint, which reports the database and the other
 * dependencies. Same rhythm as useHealth, so both cards update together.
 */
export function useReadiness() {
  return useQuery<ReadinessData, ApiError>({
    queryKey: queryKeys.health.readiness(),
    queryFn: ({ signal }) => healthApi.getReadiness(signal),
    staleTime: 0,
    retry: 1,
    retryDelay: 1_000,
    refetchInterval: HEALTH_REFETCH_MS,
    refetchOnWindowFocus: true,
  });
}
