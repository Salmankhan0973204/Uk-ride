'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { vehiclesApi } from '../api/vehicles.api';
import type { NewVehicle, Vehicle, VehicleChanges, VehicleStatus } from '../types';

type One = { vehicle: Vehicle };

/** One vehicle, for the edit form. A 404 will stay a 404, so it is not retried. */
export function useVehicle(id: string) {
  return useQuery<One, ApiError, Vehicle>({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: ({ signal }) => vehiclesApi.get(id, signal),
    select: (data) => data.vehicle,
    retry: (count, error) => error.status >= 500 && count < 2,
  });
}

/**
 * Every page of the list, and every vehicle opened in a form, sits under
 * `vehicles.all`. After a change all of them are marked stale, and the ones
 * on screen ask again. Which page the new car lands on is the server's
 * business, so nothing is guessed here.
 */
function useRefreshVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
}

export function useCreateVehicle() {
  const refresh = useRefreshVehicles();
  return useMutation<One, ApiError, NewVehicle>({
    mutationFn: vehiclesApi.create,
    onSuccess: refresh,
  });
}

export function useUpdateVehicle() {
  const refresh = useRefreshVehicles();
  return useMutation<One, ApiError, { id: string; changes: VehicleChanges }>({
    mutationFn: ({ id, changes }) => vehiclesApi.update(id, changes),
    onSuccess: refresh,
  });
}

/** Moves a vehicle between active, in maintenance and retired. */
export function useChangeVehicleStatus() {
  const refresh = useRefreshVehicles();
  return useMutation<One, ApiError, { id: string; status: VehicleStatus }>({
    mutationFn: ({ id, status }) => vehiclesApi.changeStatus(id, status),
    onSuccess: refresh,
  });
}
