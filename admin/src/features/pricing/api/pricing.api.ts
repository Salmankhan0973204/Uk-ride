import { authFetch } from '@/lib/api/client';
import type { PricingRuleInput, VehicleTypePricing } from '../types';

/** Raw HTTP functions only. No React hooks in this file. Both need an admin. */
export const pricingApi = {
  list: (signal?: AbortSignal) =>
    authFetch<{ vehicleTypes: VehicleTypePricing[] }>('/admin/pricing', { signal }),

  set: (vehicleTypeId: string, input: PricingRuleInput) =>
    authFetch<{ vehicleType: VehicleTypePricing }>(
      `/admin/pricing/${encodeURIComponent(vehicleTypeId)}`,
      { method: 'PUT', body: JSON.stringify(input) },
    ),
};
