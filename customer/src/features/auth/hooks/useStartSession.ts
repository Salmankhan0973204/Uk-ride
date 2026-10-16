'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { setAccessToken, setSessionHint } from '@/lib/auth/session';
import { queryKeys } from '@/lib/query/keys';
import type { LoginResult } from '../types';

/**
 * What every way of signing in does with the answer: sign-in, sign-up and a
 * password reset all end with the same LoginResult.
 *   - the access token is kept in memory
 *   - the "signed in" hint is set, which also tells the other tabs
 *   - the user goes straight into the cache, so /auth/me is not asked again
 */
export function useStartSession() {
  const queryClient = useQueryClient();

  return useCallback(
    ({ user, accessToken }: LoginResult) => {
      setAccessToken(accessToken);
      setSessionHint(true);
      queryClient.setQueryData(queryKeys.auth.me(), user);
    },
    [queryClient],
  );
}
