'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { authApi } from '../api/auth.api';

/** Confirms an email address from the token in an emailed link. */
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation<null, ApiError, string>({
    mutationFn: authApi.verifyEmail,
    // If this browser is signed in, its copy of the user is now out of date.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() }),
  });
}

/** Sends the confirmation link again to the signed-in user. */
export function useResendVerification() {
  const queryClient = useQueryClient();

  return useMutation<{ sent: boolean }, ApiError, void>({
    mutationFn: authApi.resendVerification,
    // "Already confirmed" means our copy of the user was stale.
    onSuccess: ({ sent }) => {
      if (!sent) void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

/** Asks for a password reset link. Succeeds for every address, by design. */
export function useForgotPassword() {
  return useMutation<null, ApiError, string>({ mutationFn: authApi.forgotPassword });
}

/** Sets a new password from the token in an emailed link. */
export function useResetPassword() {
  return useMutation<null, ApiError, { token: string; password: string }>({
    mutationFn: authApi.resetPassword,
  });
}
