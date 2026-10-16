'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { pricingApi } from '../api/pricing.api';
import type { PricingRuleInput, VehicleTypePricing } from '../types';

/** Every vehicle type with its prices. */
export function usePricing() {
  return useQuery<{ vehicleTypes: VehicleTypePricing[] }, ApiError, VehicleTypePricing[]>({
    queryKey: queryKeys.pricing.list(),
    queryFn: ({ signal }) => pricingApi.list(signal),
    select: (data) => data.vehicleTypes,
    retry: (count, error) => error.status >= 500 && count < 2,
  });
}

/**
 * Saves one vehicle type's prices. Customers' quotes are never cached for
 * long and are asked for again on every "Get prices", so only this app's
 * pricing list needs refreshing.
 */
export function useSetPricing() {
  const queryClient = useQueryClient();
  return useMutation<
    { vehicleType: VehicleTypePricing },
    ApiError,
    { vehicleTypeId: string; input: PricingRuleInput }
  >({
    mutationFn: ({ vehicleTypeId, input }) => pricingApi.set(vehicleTypeId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pricing.all }),
  });
}
