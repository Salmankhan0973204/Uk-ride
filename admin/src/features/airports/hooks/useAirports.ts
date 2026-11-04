'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { airportsApi } from '../api/airports.api';
import type { AdminAirport, AirportChanges, NewAirport } from '../types';

type One = { airport: AdminAirport };

/** Every airport, switched off or not. */
export function useAirports() {
  return useQuery<{ airports: AdminAirport[] }, ApiError, AdminAirport[]>({
    queryKey: queryKeys.airports.list(),
    queryFn: ({ signal }) => airportsApi.list(signal),
    select: (data) => data.airports,
    retry: (count, error) => error.status >= 500 && count < 2,
  });
}

/** After a change the list is asked for again; the promise keeps the form busy until it is back. */
function useRefreshAirports() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.airports.all });
}

export function useCreateAirport() {
  const refresh = useRefreshAirports();
  return useMutation<One, ApiError, NewAirport>({
    mutationFn: airportsApi.create,
    onSuccess: refresh,
  });
}

export function useUpdateAirport() {
  const refresh = useRefreshAirports();
  return useMutation<One, ApiError, { id: string; changes: AirportChanges }>({
    mutationFn: ({ id, changes }) => airportsApi.update(id, changes),
    onSuccess: refresh,
  });
}
