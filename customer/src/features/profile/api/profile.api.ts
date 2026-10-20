import type { CodeSent, Gender, User } from '@/features/auth/types';
import { authFetch } from '@/lib/api/client';

/**
 * What PATCH /users/me accepts. Send only the fields to change. The mobile is
 * not here: it is changed with a code, below.
 */
export interface ProfileChanges {
  firstName?: string;
  lastName?: string;
  /** null clears it. */
  gender?: Gender | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

/** Raw HTTP functions only. No React hooks in this file. */
export const profileApi = {
  update: (changes: ProfileChanges) =>
    authFetch<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify(changes) }),

  changePassword: (input: ChangePasswordInput) =>
    authFetch<null>('/users/me/password', post(input)),

  /** Changing the mobile, step 1: a code by text to the new number. */
  sendMobileCode: (mobile: string) =>
    authFetch<CodeSent>('/users/me/mobile/code', post({ mobile })),

  /** Changing the mobile, step 2: the code. Answers with the updated user. */
  changeMobile: (input: { mobile: string; code: string }) =>
    authFetch<{ user: User }>('/users/me/mobile', post(input)),
};
