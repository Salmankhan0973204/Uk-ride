import { apiFetch, authFetch } from '@/lib/api/client';
import type { CodeSent, CodeTicket, LoginInput, LoginResult, RegisterInput, User } from '../types';

const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

/** Raw HTTP functions only. No React hooks in this file. */
export const authApi = {
  /** Sign-up, step 1: is this email free? */
  checkEmail: (email: string) =>
    apiFetch<{ available: boolean }>('/auth/check-email', post({ email })),

  /** Sign-up, step 2: a code to the mobile by text message. */
  sendSignupCode: (mobile: string) =>
    apiFetch<CodeSent>('/auth/otp/send', post({ purpose: 'SIGNUP', mobile })),

  /** Sign-up, step 3: the code is exchanged for a ticket. */
  verifySignupCode: (input: { mobile: string; code: string }) =>
    apiFetch<CodeTicket>('/auth/otp/verify', post({ purpose: 'SIGNUP', ...input })),

  /** Sign-up, last step: creates the account and signs in, like a login. */
  register: (input: RegisterInput) => apiFetch<LoginResult>('/auth/register', post(input)),

  /** Also makes the API set the httpOnly refresh cookie. */
  login: (input: LoginInput) => apiFetch<LoginResult>('/auth/login', post(input)),

  /** Revokes the refresh token on the server and clears the cookie. */
  logout: () => apiFetch<null>('/auth/logout', { method: 'POST' }),

  /** Forgot password, step 1: a code to the email. Answers the same for every address. */
  forgotPassword: (email: string) => apiFetch<CodeSent>('/auth/forgot-password', post({ email })),

  /** Forgot password, step 2: the code is exchanged for a ticket. */
  verifyResetCode: (input: { email: string; code: string }) =>
    apiFetch<CodeTicket>('/auth/forgot-password/verify', post(input)),

  /** Forgot password, step 3: the new password. Ends every session, then signs in here. */
  resetPassword: (input: { email: string; otpTicket: string; password: string }) =>
    apiFetch<LoginResult>('/auth/reset-password', post(input)),

  /** The signed-in user. Needs a session; authFetch refreshes the token if it must. */
  me: (signal?: AbortSignal) => authFetch<{ user: User }>('/auth/me', { signal }),
};
