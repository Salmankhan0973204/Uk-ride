import { apiFetch } from '@/lib/api/client';
import type { RegisterInput, User } from '../types';

/** Raw HTTP functions only. No React hooks in this file. */
export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
};
