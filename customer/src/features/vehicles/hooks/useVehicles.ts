'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { vehiclesApi } from '../api/vehicles.api';
import type { VehicleListQuery } from '../types';

/**
 * One page of the fleet.
 *
 * The query is part of the key, so page 1 and page 2, or "all" and
 * "in maintenance", are cached separately, and going back to a page already
 * seen is instant.
 *
 * `placeholderData: keepPreviousData` keeps the page on screen while the
 * next one loads, instead of flashing an empty table. `isPlaceholderData`
 * says when that is happening.
 */
export function useVehicles(query: VehicleListQuery) {
  return useQuery({
    queryKey: queryKeys.vehicles.list(query),
    queryFn: ({ signal }) => vehiclesApi.list(query, signal),
    placeholderData: keepPreviousData,
    retry: (count, error: ApiError) => error.status >= 500 && count < 2,
  });
}
