import { apiFetch } from '@/lib/api/client';
import type { VehicleType } from '../types';

/** Raw HTTP functions only. No React hooks in this file. */
export const vehicleTypesApi = {
  /** Public: works signed out, so it uses apiFetch, not authFetch. */
  list: (signal?: AbortSignal) =>
    apiFetch<{ vehicleTypes: VehicleType[] }>('/vehicle-types', { signal }),
};
