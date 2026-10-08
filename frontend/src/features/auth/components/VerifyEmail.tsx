'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useVerifyEmail } from '../hooks/useEmailActions';
import { useMe } from '../hooks/useMe';

const heading = 'text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl';

/**
 * Where the link in the confirmation email lands. It reads the token from the
 * address, sends it to the API once, and shows what happened.
 */
export function VerifyEmail() {
  const token = useSearchParams().get('token');
  const { mutate, isSuccess, isError, error } = useVerifyEmail();
  const { data: user } = useMe();

  // A link works once, and in development React runs effects twice. The ref
  // makes sure the token is only ever sent one time.
  const sent = useRef(false);
  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    mutate(token);
  }, [token, mutate]);

  if (!token || isError) {
    const unreachable = isError && error.isNetworkError;

    return (
      <Card className="rise mx-auto max-w-md">
        <div role="alert" className="space-y-6">
          <div className="space-y-2">
            <h1 className={heading}>
              {unreachable ? 'We could not reach the server' : 'This link did not work'}
            </h1>
            <p className="text-base leading-relaxed text-ink-muted">
              {unreachable
                ? 'Your email has not been confirmed yet. Check your connection and open the link again.'
                : 'It may have expired, or been used already. A confirmation link works once and lasts 24 hours.'}
            </p>
          </div>
          {unreachable ? null : (
            <Link href={user ? '/account' : '/login'} className="btn btn-primary">
              {user ? 'Send a new link from your account' : 'Sign in to send a new link'}
            </Link>
          )}
        </div>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="rise mx-auto max-w-md">
        <div className="space-y-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-glass-border bg-glass-strong text-success shadow-[0_0_28px_rgb(110_231_183/0.35)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div className="space-y-2">
            <h1 className={heading}>Email address confirmed</h1>
            <p role="status" className="text-base leading-relaxed text-ink-muted">
              Thank you. Your UkRide account is fully set up.
            </p>
          </div>
          <Link href={user ? '/account' : '/login'} className="btn btn-primary">
            {user ? 'Go to your account' : 'Sign in'}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <div role="status" className="flex items-center gap-3">
        <Spinner />
        <p className="text-base text-ink-muted">Confirming your email address</p>
      </div>
    </Card>
  );
}
