'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { useStaff, useStaffLogout } from '../hooks/useStaff';
import type { StaffUser } from '../types';

/**
 * The guard for every admin page. Signed out: off to /login. Signed in but no
 * longer staff (the API answers 403): told so, with a way to sign out. While
 * the check runs, nothing private is drawn.
 *
 * This runs in the browser, so it is a convenience: the API checks the staff
 * token and the role on every request, and that is the real protection.
 */
export function StaffGate({ children }: { children: (user: StaffUser) => React.ReactNode }) {
  const router = useRouter();
  const { data: user, isPending, isError, error, refetch, isFetching } = useStaff();
  const logout = useStaffLogout();

  useEffect(() => {
    if (user === null) router.replace('/login');
  }, [user, router]);

  if (isError && error.status === 403) {
    return (
      <Centred>
        <div role="alert" className="space-y-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">
            Your account is not staff
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            You are signed in, but this account can no longer use the admin panel. If you think it
            should, ask an administrator.
          </p>
          <button
            type="button"
            onClick={() => logout.mutate(undefined, { onSettled: () => router.replace('/login') })}
            disabled={logout.isPending}
            className="btn btn-primary"
          >
            Sign out
          </button>
        </div>
      </Centred>
    );
  }

  // The API could not be reached, so we do not know. Do not guess "signed out".
  if (isError) {
    return (
      <Centred>
        <div role="alert" className="space-y-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">
            We could not reach the API
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            You are still signed in; the panel will work again when the connection is back.
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
      </Centred>
    );
  }

  if (isPending || !user) {
    return (
      <Centred>
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-base text-ink-muted">Checking your sign-in</p>
        </div>
      </Centred>
    );
  }

  return <>{children(user)}</>;
}

function Centred({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-16 pb-16">
      <Card className="rise">{children}</Card>
    </main>
  );
}
