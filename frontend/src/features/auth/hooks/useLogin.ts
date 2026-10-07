'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { setAccessToken, setSessionHint } from '@/lib/auth/session';
import { queryKeys } from '@/lib/query/keys';
import { authApi } from '../api/auth.api';
import type { LoginInput, LoginResult } from '../types';

/** Signs in, keeps the access token in memory and tells the rest of the app who it is. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResult, ApiError, LoginInput>({
    mutationFn: authApi.login,
    onSuccess: ({ user, accessToken }) => {
      setAccessToken(accessToken);
      setSessionHint(true);
      // The answer already holds the user, so the cache is filled directly
      // instead of asking /auth/me again.
      queryClient.setQueryData(queryKeys.auth.me(), user);
    },
  });
}
