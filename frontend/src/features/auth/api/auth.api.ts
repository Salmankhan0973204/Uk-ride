import { apiFetch, authFetch } from '@/lib/api/client';
import type { LoginInput, LoginResult, RegisterInput, User } from '../types';

/** Raw HTTP functions only. No React hooks in this file. */
export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),

  /** Also makes the API set the httpOnly refresh cookie. */
  login: (input: LoginInput) =>
    apiFetch<LoginResult>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),

  /** Revokes the refresh token on the server and clears the cookie. */
  logout: () => apiFetch<null>('/auth/logout', { method: 'POST' }),

  /** The signed-in user. Needs a session; authFetch refreshes the token if it must. */
  me: (signal?: AbortSignal) => authFetch<{ user: User }>('/auth/me', { signal }),
};
