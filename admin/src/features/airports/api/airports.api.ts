import { authFetch } from '@/lib/api/client';
import type { AdminAirport, AirportChanges, NewAirport } from '../types';

type One = { airport: AdminAirport };

/** Raw HTTP functions only. No React hooks in this file. All need an admin. */
export const airportsApi = {
  list: (signal?: AbortSignal) =>
    authFetch<{ airports: AdminAirport[] }>('/admin/airports', { signal }),

  create: (input: NewAirport) =>
    authFetch<One>('/admin/airports', { method: 'POST', body: JSON.stringify(input) }),

  update: (id: string, changes: AirportChanges) =>
    authFetch<One>(`/admin/airports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),
};
