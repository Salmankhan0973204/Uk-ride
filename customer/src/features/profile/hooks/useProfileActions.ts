'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CodeSent, User } from '@/features/auth/types';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { profileApi } from '../api/profile.api';
import type { ChangePasswordInput, ProfileChanges } from '../api/profile.api';

/**
 * Saves profile changes.
 *
 * The API answers with the updated user, so it is written straight into the
 * `auth.me` cache. Everything that reads `useMe()` (the name in the
 * navigation, the profile page) shows the new values at once, with no second
 * request. Invalidating the query would also work, but it would ask the
 * server for something we were just given.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<{ user: User }, ApiError, ProfileChanges>({
    mutationFn: profileApi.update,
    onSuccess: ({ user }) => queryClient.setQueryData(queryKeys.auth.me(), user),
  });
}

/** Changing the mobile, step 1: sends a code by text to the new number. */
export function useSendMobileCode() {
  return useMutation<CodeSent, ApiError, string>({ mutationFn: profileApi.sendMobileCode });
}

/** Changing the mobile, step 2: the code. The updated user goes straight into the cache. */
export function useChangeMobile() {
  const queryClient = useQueryClient();

  return useMutation<{ user: User }, ApiError, { mobile: string; code: string }>({
    mutationFn: profileApi.changeMobile,
    onSuccess: ({ user }) => queryClient.setQueryData(queryKeys.auth.me(), user),
  });
}

/** Changes the password. The user stays signed in here; other devices are signed out. */
export function useChangePassword() {
  return useMutation<null, ApiError, ChangePasswordInput>({
    mutationFn: profileApi.changePassword,
  });
}
