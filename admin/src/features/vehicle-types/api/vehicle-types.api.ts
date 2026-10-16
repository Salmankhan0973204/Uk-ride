import { authFetch } from '@/lib/api/client';
import type { AdminVehicleType, NewVehicleType, VehicleTypeChanges } from '../types';

type One = { vehicleType: AdminVehicleType };

/** Raw HTTP functions only. No React hooks in this file. */
export const vehicleTypesApi = {
  // Every call needs a staff access token with the ADMIN role.
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
