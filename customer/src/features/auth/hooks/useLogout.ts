'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { setAccessToken, setSessionHint } from '@/lib/auth/session';
import { queryKeys } from '@/lib/query/keys';
import { authApi } from '../api/auth.api';

/**
 * Signs out. The browser forgets the session whatever the API answers: if the
 * request fails (offline), staying "signed in" on screen would be worse.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<null, ApiError, void>({
    mutationFn: authApi.logout,
    onSettled: () => {
      setAccessToken(null);
      setSessionHint(false);
      queryClient.setQueryData(queryKeys.auth.me(), null);
    },
  });
}
