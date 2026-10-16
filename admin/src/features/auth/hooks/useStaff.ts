'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, setAccessToken, setSessionHint } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { staffAuthApi } from '../api/staff-auth.api';
import type { StaffLoginInput, StaffLoginResult, StaffUser } from '../types';

/**
 * Who is signed in to the admin panel: the staff member, or `null` when
 * nobody is. A 403 is an error, not `null`: it means the account is signed in
 * but is no longer staff, and the guard says so.
 */
export function useStaff() {
  return useQuery<StaffUser | null, ApiError>({
    queryKey: queryKeys.auth.me(),
    queryFn: async ({ signal }) => {
      try {
        return (await staffAuthApi.me(signal)).user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Signs a staff member in and fills the cache with who they are. */
export function useStaffLogin() {
  const queryClient = useQueryClient();

  return useMutation<StaffLoginResult, ApiError, StaffLoginInput>({
    mutationFn: staffAuthApi.login,
    onSuccess: ({ user, accessToken }) => {
      setAccessToken(accessToken);
      setSessionHint(true);
      queryClient.setQueryData(queryKeys.auth.me(), user);
    },
  });
}

/**
 * Signs out of the admin panel. The browser forgets the session whatever the
 * API answers, and every cached admin answer is dropped with it.
 */
export function useStaffLogout() {
  const queryClient = useQueryClient();

  return useMutation<null, ApiError, void>({
    mutationFn: staffAuthApi.logout,
    onSettled: () => {
      setAccessToken(null);
      setSessionHint(false);
      queryClient.clear();
      queryClient.setQueryData(queryKeys.auth.me(), null);
    },
  });
}
