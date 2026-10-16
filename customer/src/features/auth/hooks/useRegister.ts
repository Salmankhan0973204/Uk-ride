'use client';

import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { authApi } from '../api/auth.api';
import type { RegisterInput, User } from '../types';

/**
 * Creates an account. A mutation, not a query: it changes data on the server
 * and runs only when the form is submitted.
 */
export function useRegister() {
  return useMutation<{ user: User }, ApiError, RegisterInput>({
    mutationFn: authApi.register,
  });
}
