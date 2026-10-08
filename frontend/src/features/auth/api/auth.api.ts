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

  /** Confirms an email address with the token from the emailed link. */
  verifyEmail: (token: string) =>
    apiFetch<null>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  /** Sends the confirmation link again. `sent` is false when already confirmed. */
  resendVerification: () =>
    authFetch<{ sent: boolean }>('/auth/resend-verification', { method: 'POST' }),

  /** Asks for a reset link. Answers the same for every address. */
  forgotPassword: (email: string) =>
    apiFetch<null>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  /** Sets a new password with the token from the emailed link. */
  resetPassword: (input: { token: string; password: string }) =>
    apiFetch<null>('/auth/reset-password', { method: 'POST', body: JSON.stringify(input) }),

  /** The signed-in user. Needs a session; authFetch refreshes the token if it must. */
  me: (signal?: AbortSignal) => authFetch<{ user: User }>('/auth/me', { signal }),
};
