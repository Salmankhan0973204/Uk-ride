'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useMe } from '../hooks/useMe';
import type { User } from '../types';

interface AccountGateProps {
  /**
   * Draws the page for a signed-in user. `leave` must be called before the
   * page signs the user out on purpose, so the gate does not also redirect.
   */
  children: (user: User, leave: () => void) => React.ReactNode;
}

/**
 * The guard for every page that needs a signed-in user.
 *
 * It reads who is signed in from `useMe()`. A visitor who is not signed in is
 * sent to the sign-in page, and nothing private is drawn while the check is
 * still running. Wrap a page in it and the page only ever sees a real user.
 *
 * This runs in the browser, so it is a convenience, not security: what is
 * actually protected is the data, which the API refuses without a token.
 */
export function AccountGate({ children }: AccountGateProps) {
  const router = useRouter();
  const { data: user, isPending, isError, refetch, isFetching } = useMe();
  // Set when the page is about to sign the user out on purpose.
  const [leaving, setLeaving] = useState(false);

  // `user === null` means the check finished and nobody is signed in.
  useEffect(() => {
    if (user === null && !leaving) router.replace('/login');
  }, [user, leaving, router]);

  // The API could not be reached, so we do not know. Do not guess "signed out".
  if (isError) {
    return (
      <Card className="mx-auto max-w-xl">
        <div role="alert" className="space-y-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            We could not load your account
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            The server did not answer. You are still signed in; this page will work again when the
            connection is back.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-primary"
          >
            {isFetching ? 'Trying again' : 'Try again'}
          </button>
        </div>
      </Card>
    );
  }

  // Still checking, or about to leave for the sign-in page.
  if (isPending || !user) {
    return (
      <Card className="mx-auto max-w-xl">
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-base text-ink-muted">Loading your account</p>
        </div>
      </Card>
    );
  }

  return <>{children(user, () => setLeaving(true))}</>;
}
