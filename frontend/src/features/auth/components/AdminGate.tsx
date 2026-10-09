'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { User } from '../types';
import { AccountGate } from './AccountGate';

/**
 * The guard for admin pages. AccountGate answers "is someone signed in";
 * this adds "and are they an admin". A signed-in customer is told plainly
 * that the page is not theirs, instead of being bounced to the sign-in page.
 *
 * As with AccountGate, this is a convenience. The API checks the role again
 * on every request, and that check is the real one.
 */
export function AdminGate({ children }: { children: (user: User) => React.ReactNode }) {
  return (
    <AccountGate>
      {(user) =>
        user.role === 'ADMIN' ? (
          children(user)
        ) : (
          <Card className="rise mx-auto max-w-xl">
            <div className="space-y-5">
              <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                This page is for staff
              </h1>
              <p className="text-base leading-relaxed text-ink-muted">
                You are signed in, but your account cannot manage UkRide. If you think it should,
                ask an administrator.
              </p>
              <Link href="/account" className="btn btn-primary">
                Back to your account
              </Link>
            </div>
          </Card>
        )
      }
    </AccountGate>
  );
}
