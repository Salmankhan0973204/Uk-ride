'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatMobile } from '@/lib/phone/mobile';
import { useResendVerification } from '../hooks/useEmailActions';
import { useLogout } from '../hooks/useLogout';
import { GENDER_OPTIONS } from '../types';
import type { User } from '../types';
import { AccountGate } from './AccountGate';

const memberSince = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** What the page says after coming back from one of its forms. */
const DONE: Record<string, string> = {
  profile: 'Your profile has been updated.',
  password: 'Your password has been changed. Other devices have been signed out.',
};

/**
 * The profile page. It makes no request of its own: the user is already in
 * the cache, put there by `useMe()` when the app loaded or by signing in.
 * Editing the profile updates that same cache, so this page is current the
 * moment the form sends you back.
 */
export function AccountPanel() {
  return <AccountGate>{(user, leave) => <Profile user={user} onSigningOut={leave} />}</AccountGate>;
}

function Profile({ user, onSigningOut }: { user: User; onSigningOut: () => void }) {
  const router = useRouter();
  const done = DONE[useSearchParams().get('done') ?? ''];
  const logout = useLogout();
  const resend = useResendVerification();

  function signOut() {
    // Signing out empties the user, and the gate would send the person to the
    // sign-in page. Telling it first lets this page send them home instead.
    onSigningOut();
    logout.mutate(undefined, { onSettled: () => router.replace('/') });
  }

  const gender = GENDER_OPTIONS.find((option) => option.value === user.gender)?.label;
  const details = [
    ['Email', user.email],
    ['Mobile', formatMobile(user.mobile)],
    ...(gender ? [['Gender', gender]] : []),
    ['Member since', memberSince(user.createdAt)],
  ];

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        {done ? (
          <p
            role="status"
            className="rounded-2xl border border-success/50 bg-[rgb(110_231_183/0.12)] px-4 py-3 text-sm leading-relaxed font-medium"
          >
            {done}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="lift flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-accent to-accent-2 text-lg font-semibold"
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

        <dl className="tabular divide-y divide-line border-y border-line">
          {details.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-right font-medium break-all">
                {value}
                {label === 'Email' ? (
                  <Badge variant={user.emailVerifiedAt ? 'success' : 'warning'}>
                    {user.emailVerifiedAt ? 'Confirmed' : 'Not confirmed'}
                  </Badge>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>

        {user.emailVerifiedAt ? null : (
          <div className="space-y-3 rounded-2xl border border-warning/50 bg-[rgb(252_211_77/0.12)] px-4 py-3">
            <p className="text-sm leading-relaxed">
              Please confirm your email address. We sent a link to{' '}
              <span className="font-medium break-all">{user.email}</span> when you registered.
            </p>
            {resend.isSuccess && resend.data.sent ? (
              <p role="status" className="text-sm font-medium text-success">
                A new link is on its way. It lasts 24 hours.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => resend.mutate()}
                disabled={resend.isPending}
                className="btn btn-ghost min-h-11! text-sm"
              >
                {resend.isPending ? (
                  <>
                    <Spinner />
                    Sending
                  </>
                ) : (
                  'Send the link again'
                )}
              </button>
            )}
            {resend.isError ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {resend.error.status === 429
                  ? resend.error.message
                  : 'We could not send the link. Try again in a moment.'}
              </p>
            ) : null}
          </div>
        )}

        {user.role === 'ADMIN' ? (
          <p className="text-base leading-relaxed">
            You are an administrator.{' '}
            <Link
              href="/admin/vehicle-types"
              className="font-medium underline decoration-ring/70 decoration-2 underline-offset-4 hover:decoration-ring"
            >
              Manage vehicle types
            </Link>
          </p>
        ) : null}

        {/* One accent button: editing is what this page is for. */}
        <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Link href="/account/edit" className="btn btn-primary">
            Edit profile
          </Link>
          <Link href="/account/password" className="btn btn-ghost">
            Change password
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={logout.isPending}
            className="btn btn-ghost sm:ml-auto"
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

        <p className="text-sm leading-relaxed text-ink-muted">
          Prices, bookings and trip tracking will appear here as each part of UkRide opens.
        </p>
      </div>
    </Card>
  );
}
