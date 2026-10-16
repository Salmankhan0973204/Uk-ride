'use client';

import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { authApi } from '../api/auth.api';
import type { LoginInput, LoginResult } from '../types';
import { useStartSession } from './useStartSession';

/** Signs in, keeps the access token in memory and tells the rest of the app who it is. */
export function useLogin() {
  const startSession = useStartSession();

  return useMutation<LoginResult, ApiError, LoginInput>({
    mutationFn: authApi.login,
    onSuccess: startSession,
  });
}
