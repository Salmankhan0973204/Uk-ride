'use client';

import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { authApi } from '../api/auth.api';
import type { CodeSent, CodeTicket, LoginResult } from '../types';
import { useStartSession } from './useStartSession';

/** Forgot password, step 1. Succeeds for every address, by design. */
export function useForgotPassword() {
  return useMutation<CodeSent, ApiError, string>({ mutationFn: authApi.forgotPassword });
}

/** Forgot password, step 2: the code from the email becomes a ticket. */
export function useVerifyResetCode() {
  return useMutation<CodeTicket, ApiError, { email: string; code: string }>({
    mutationFn: authApi.verifyResetCode,
  });
}

/** Forgot password, step 3: the new password. The answer signs the person in. */
export function useResetPassword() {
  const startSession = useStartSession();

  return useMutation<LoginResult, ApiError, { email: string; otpTicket: string; password: string }>(
    { mutationFn: authApi.resetPassword, onSuccess: startSession },
  );
}
