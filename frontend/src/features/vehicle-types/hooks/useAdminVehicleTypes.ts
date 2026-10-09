'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { vehicleTypesApi } from '../api/vehicle-types.api';
import type { AdminVehicleType, NewVehicleType, VehicleTypeChanges } from '../types';

type One = { vehicleType: AdminVehicleType };

/** Every vehicle type, switched off or not. For admins. */
export function useAdminVehicleTypes() {
  return useQuery<{ vehicleTypes: AdminVehicleType[] }, ApiError, AdminVehicleType[]>({
    queryKey: queryKeys.vehicleTypes.admin(),
    queryFn: ({ signal }) => vehicleTypesApi.adminList(signal),
    select: (data) => data.vehicleTypes,
    // A 403 will be a 403 again: asking three more times helps nobody.
    retry: false,
  });
}

/**
 * After a change, the lists in the cache are out of date. Invalidating
 * `vehicleTypes.all` marks every query under that key as stale (the admin's
 * table and the public catalogue) and refetches the ones on screen.
 *
 * Compare with the profile form, which wrote its answer into the cache. That
 * works for one record. Here a change can move a row, add one, or hide one
 * from the public list, so asking the server again is simpler and always
 * right.
 *
 * The promise is returned, so a mutation stays "pending" until the fresh list
 * has arrived: the table is already correct when the form sends you back.
 */
function useRefreshVehicleTypes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.all });
}

export function useCreateVehicleType() {
  const refresh = useRefreshVehicleTypes();
  return useMutation<One, ApiError, NewVehicleType>({
    mutationFn: vehicleTypesApi.create,
    onSuccess: refresh,
  });
}

export function useUpdateVehicleType() {
  const refresh = useRefreshVehicleTypes();
  return useMutation<One, ApiError, { id: string; changes: VehicleTypeChanges }>({
    mutationFn: ({ id, changes }) => vehicleTypesApi.update(id, changes),
    onSuccess: refresh,
  });
}
