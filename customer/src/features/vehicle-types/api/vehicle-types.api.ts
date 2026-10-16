import { apiFetch, authFetch } from '@/lib/api/client';
import type { AdminVehicleType, NewVehicleType, VehicleType, VehicleTypeChanges } from '../types';

type One = { vehicleType: AdminVehicleType };

/** Raw HTTP functions only. No React hooks in this file. */
export const vehicleTypesApi = {
  /** Public: works signed out, so it uses apiFetch, not authFetch. */
  list: (signal?: AbortSignal) =>
    apiFetch<{ vehicleTypes: VehicleType[] }>('/vehicle-types', { signal }),

  // Everything below needs an admin's access token.
  adminList: (signal?: AbortSignal) =>
    authFetch<{ vehicleTypes: AdminVehicleType[] }>('/admin/vehicle-types', { signal }),

  create: (input: NewVehicleType) =>
    authFetch<One>('/admin/vehicle-types', { method: 'POST', body: JSON.stringify(input) }),

  update: (id: string, changes: VehicleTypeChanges) =>
    authFetch<One>(`/admin/vehicle-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  /** A soft delete: the type is switched off, not removed. */
  deactivate: (id: string) => authFetch<One>(`/admin/vehicle-types/${id}`, { method: 'DELETE' }),
};
