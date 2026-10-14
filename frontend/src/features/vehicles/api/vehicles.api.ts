import { authFetchWithMeta } from '@/lib/api/client';
import type { PageMeta, Vehicle, VehicleListQuery } from '../types';

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
};
