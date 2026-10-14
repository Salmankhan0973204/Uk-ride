import { authFetch, authFetchWithMeta } from '@/lib/api/client';
import type {
  NewVehicle,
  PageMeta,
  Vehicle,
  VehicleChanges,
  VehicleListQuery,
  VehicleStatus,
} from '../types';

type One = { vehicle: Vehicle };

/** "?page=2&status=ACTIVE". Empty values and page 1 are left out. */
export function toQueryString({ page, status, type, search }: VehicleListQuery) {
  const params = new URLSearchParams();
  if (page && page > 1) params.set('page', String(page));
  if (status) params.set('status', status);
  if (type) params.set('type', type);
  if (search) params.set('search', search);
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** Raw HTTP functions only. No React hooks in this file. All of them need an admin. */
export const vehiclesApi = {
  /** One page of the fleet, and the page numbers from `meta`. */
  list: async (query: VehicleListQuery, signal?: AbortSignal) => {
    const body = await authFetchWithMeta<{ vehicles: Vehicle[] }>(
      `/admin/vehicles${toQueryString(query)}`,
      { signal },
    );
    return { vehicles: body.data.vehicles, meta: body.meta as unknown as PageMeta };
  },

  get: (id: string, signal?: AbortSignal) =>
    authFetch<One>(`/admin/vehicles/${encodeURIComponent(id)}`, { signal }),

  create: (input: NewVehicle) =>
    authFetch<One>('/admin/vehicles', { method: 'POST', body: JSON.stringify(input) }),

  update: (id: string, changes: VehicleChanges) =>
    authFetch<One>(`/admin/vehicles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  changeStatus: (id: string, status: VehicleStatus) =>
    authFetch<One>(`/admin/vehicles/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
