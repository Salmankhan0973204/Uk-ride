import { apiFetch, authFetch } from '@/lib/api/client';
import type { StaffLoginInput, StaffLoginResult, StaffUser } from '../types';

/** Raw HTTP functions only. No React hooks in this file. */
export const staffAuthApi = {
  /** Also makes the API set the staff refresh cookie. */
  login: (input: StaffLoginInput) =>
    apiFetch<StaffLoginResult>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  /** Ends the staff session only; a customer sign-in in the same browser stays. */
  logout: () => apiFetch<null>('/admin/auth/logout', { method: 'POST' }),

  /** The signed-in staff member. The API checks the role on every call. */
  me: (signal?: AbortSignal) => authFetch<{ user: StaffUser }>('/admin/auth/me', { signal }),
};
