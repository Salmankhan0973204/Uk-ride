'use client';

import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';
import { authApi } from '../api/auth.api';
import type { CodeSent, CodeTicket, LoginResult, RegisterInput } from '../types';
import { useStartSession } from './useStartSession';

/*
 * The requests of sign-up, as on ukride.uk: is the email free, a code to the
 * mobile, the code checked, then the account. Mutations, not queries: each
 * runs only when the person presses a button.
 */

export function useCheckEmail() {
  return useMutation<{ available: boolean }, ApiError, string>({ mutationFn: authApi.checkEmail });
}

export function useSendSignupCode() {
  return useMutation<CodeSent, ApiError, string>({ mutationFn: authApi.sendSignupCode });
}

export function useVerifySignupCode() {
  return useMutation<CodeTicket, ApiError, { mobile: string; code: string }>({
    mutationFn: authApi.verifySignupCode,
  });
}

/** Creates the account. The answer signs the person in, as a login does. */
export function useRegister() {
  const startSession = useStartSession();

  return useMutation<LoginResult, ApiError, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: startSession,
  });
}
