'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { vehicleTypesApi } from '../api/vehicle-types.api';
import type { VehicleType } from '../types';

/**
 * The catalogue: every vehicle type on offer.
 *
 * A list query. `select` unwraps the envelope's `vehicleTypes` key, so a
 * component gets the array itself. The list changes rarely, so an answer is
 * treated as fresh for a minute: moving between pages does not ask again.
 */
export function useVehicleTypes() {
  return useQuery<{ vehicleTypes: VehicleType[] }, ApiError, VehicleType[]>({
    queryKey: queryKeys.vehicleTypes.list(),
    queryFn: ({ signal }) => vehicleTypesApi.list(signal),
    select: (data) => data.vehicleTypes,
    staleTime: 60_000,
  });
}
