'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/features/auth/types';
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

/** Changes the password. The user stays signed in here; other devices are signed out. */
export function useChangePassword() {
  return useMutation<null, ApiError, ChangePasswordInput>({
    mutationFn: profileApi.changePassword,
  });
}
