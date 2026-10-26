'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@ukride/shared/ui/Badge';
import { Card } from '@ukride/shared/ui/Card';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { formatMobile } from '@ukride/shared/phone';
import { AccountGate } from '@/features/auth/components/AccountGate';
import { textLink } from '@/features/auth/components/AuthParts';
import { useLogout } from '@/features/auth/hooks/useLogout';
import type { User } from '@/features/auth/types';
import { PersonalDetailsForm } from './PersonalDetailsForm';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001';

const memberSince = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** What the page says after coming back from one of its flows. */
const DONE: Record<string, string> = {
  welcome: 'Welcome to UkRide. Your account is ready and your mobile is confirmed.',
  reset:
    'Your password has been changed. Other devices have been signed out; this one is signed in.',
  password: 'Your password has been changed. Other devices have been signed out.',
  mobile: 'Your mobile number has been changed and confirmed.',
};

const panelTitle = 'text-xl font-semibold tracking-tight';

/**
 * The profile page, as on ukride.uk: one page for everything about the
 * account.
 *   - who you are, with Sign out
 *   - personal details, edited in place
 *   - sign-in details: the email, the mobile (changed with a code) and the
 *     password, each with its own way to change it
 *
 * It makes no request of its own: the user is already in the cache, put there
 * by `useMe()` or by signing in.
 */
export function ProfilePage() {
  return <AccountGate>{(user, leave) => <Profile user={user} onSigningOut={leave} />}</AccountGate>;
}

function Profile({ user, onSigningOut }: { user: User; onSigningOut: () => void }) {
  const router = useRouter();
  const done = DONE[useSearchParams().get('done') ?? ''];
  const logout = useLogout();

  function signOut() {
    // Signing out empties the user, and the gate would send the person to the
    // sign-in page. Telling it first lets this page send them home instead.
    onSigningOut();
    logout.mutate(undefined, { onSettled: () => router.replace('/') });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {done ? (
        <p
          role="status"
          className="rise rounded-2xl border border-success/50 bg-[rgb(110_231_183/0.12)] px-4 py-3 text-sm leading-relaxed font-medium"
        >
          {done}
        </p>
      ) : null}

      <Card className="rise">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-5">
          <span
            aria-hidden="true"
            className="lift flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-accent to-accent-2 text-lg font-semibold"
          >
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-base text-ink-muted">Member since {memberSince(user.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={logout.isPending}
            className="btn btn-ghost w-full sm:w-auto"
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

        {user.role === 'ADMIN' ? (
          <p className="mt-6 border-t border-line pt-5 text-base leading-relaxed">
            You are an administrator.{' '}
            {/* The admin panel is a separate app with its own staff sign-in. */}
            <a href={ADMIN_URL} className={textLink}>
              Open the admin panel
            </a>
          </p>
        ) : null}
      </Card>

      <Card className="rise [animation-delay:90ms]">
        <section aria-labelledby="personal-details" className="space-y-6">
          <div className="space-y-1">
            <h2 id="personal-details" className={panelTitle}>
              Personal details
            </h2>
            <p className="text-sm text-ink-muted">Your name and, if you like, your gender.</p>
          </div>
          <PersonalDetailsForm user={user} />
        </section>
      </Card>

      <Card className="rise [animation-delay:180ms]">
        <section aria-labelledby="sign-in-details" className="space-y-4">
          <h2 id="sign-in-details" className={panelTitle}>
            Sign-in details
          </h2>

          <dl className="divide-y divide-line border-y border-line">
            <Row label="Email">
              <span className="break-all">{user.email}</span>
            </Row>
            <Row label="Mobile" action={{ href: '/profile/mobile', label: 'Change mobile' }}>
              <span className="tabular whitespace-nowrap">{formatMobile(user.mobile)}</span>
              {user.phoneVerifiedAt ? <Badge variant="success">Verified</Badge> : null}
            </Row>
            <Row label="Password" action={{ href: '/profile/password', label: 'Change password' }}>
              {/* Never shown; the dots only say there is one. */}
              <span aria-label="Hidden" className="tracking-widest text-ink-muted">
                ••••••••
              </span>
            </Row>
          </dl>

          <p className="text-sm text-ink-muted">
            Your email address cannot be changed yet. Changing your mobile needs a code sent to the
            new number.
          </p>
        </section>
      </Card>
    </div>
  );
}

/** One line of the sign-in details: label, value, and how to change it. */
function Row({
  label,
  action,
  children,
}: {
  label: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[7rem_1fr_auto] sm:items-baseline">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-medium">{children}</dd>
      {action ? (
        <dd className="sm:text-right">
          <Link href={action.href} className={`${textLink} inline-block py-2.5 text-sm sm:py-0`}>
            {action.label}
          </Link>
        </dd>
      ) : null}
    </div>
  );
}
