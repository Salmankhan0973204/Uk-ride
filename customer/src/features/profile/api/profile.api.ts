import type { Gender, User } from '@/features/auth/types';
import { authFetch } from '@/lib/api/client';

/** What PATCH /users/me accepts. Send only the fields to change. */
export interface ProfileChanges {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  /** null clears it. */
  gender?: Gender | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** Raw HTTP functions only. No React hooks in this file. */
export const profileApi = {
  update: (changes: ProfileChanges) =>
    authFetch<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify(changes) }),

  changePassword: (input: ChangePasswordInput) =>
    authFetch<null>('/users/me/password', { method: 'POST', body: JSON.stringify(input) }),
};
