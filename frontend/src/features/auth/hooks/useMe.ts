'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { authApi } from '../api/auth.api';
import type { User } from '../types';

/**
 * Who is signed in. This query is the web app's auth state: every component
 * that needs the user reads it from here, and login and logout update it.
 *
 * `data` is the user, or `null` when nobody is signed in. "Not signed in" is
 * an answer, not an error, so a 401 is turned into `null`.
 */
export function useMe() {
  return useQuery<User | null, ApiError>({
    queryKey: queryKeys.auth.me(),
    queryFn: async ({ signal }) => {
      try {
        return (await authApi.me(signal)).user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    // The user rarely changes, and login and logout write the new value directly.
    staleTime: 5 * 60_000,
    retry: false,
  });
}
