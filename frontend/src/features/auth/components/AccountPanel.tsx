'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useLogout } from '../hooks/useLogout';
import { useMe } from '../hooks/useMe';
import { GENDER_OPTIONS } from '../types';

const memberSince = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * The account page: a protected screen. It shows only for a signed-in user.
 * Anyone else is sent to the sign-in page, and nothing private is drawn while
 * the check is still running.
 */
export function AccountPanel() {
  const router = useRouter();
  const { data: user, isPending, isError, refetch, isFetching } = useMe();
  const logout = useLogout();
  // True from the moment "Sign out" is pressed. Signing out also makes
  // `user` null, and without this the guard below would send the person to
  // the sign-in page instead of home.
  const signingOut = useRef(false);

  // The route guard. `user === null` means the check finished and nobody is signed in.
  useEffect(() => {
    if (user === null && !signingOut.current) router.replace('/login');
  }, [user, router]);

  function signOut() {
    signingOut.current = true;
    logout.mutate(undefined, { onSettled: () => router.replace('/') });
  }

  // The API could not be reached, so we do not know. Do not guess "signed out".
  if (isError) {
    return (
      <Card className="mx-auto max-w-xl">
        <div role="alert" className="space-y-5">
          <h1 className="text-2xl font-semibold tracking-tight">We could not load your account</h1>
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

  const gender = GENDER_OPTIONS.find((option) => option.value === user.gender)?.label;
  const details = [
    ['Email', user.email],
    ['Mobile', user.mobile],
    ...(gender ? [['Gender', gender]] : []),
    ['Member since', memberSince(user.createdAt)],
  ];

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-accent to-accent-2 text-lg font-semibold shadow-[0_0_24px_rgb(139_92_246/0.6)]"
          >
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </span>
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-base text-ink-muted">Your UkRide account</p>
          </div>
        </div>

        <dl className="divide-y divide-line rounded-2xl border border-line bg-glass px-4">
          {details.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="text-right font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-sm leading-relaxed text-ink-muted">
          Prices, bookings and trip tracking will appear here as each part of UkRide opens.
        </p>

        <button
          type="button"
          onClick={signOut}
          disabled={logout.isPending}
          className="btn btn-ghost"
        >
          {logout.isPending ? (
            <>
              <Spinner />
              Signing you out
            </>
          ) : (
            'Sign out'
          )}
        </button>
      </div>
    </Card>
  );
}
