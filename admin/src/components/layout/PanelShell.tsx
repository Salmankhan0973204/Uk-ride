'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { StaffGate } from '@/features/auth/components/StaffGate';
import { useStaffLogout } from '@/features/auth/hooks/useStaff';
import type { StaffUser } from '@/features/auth/types';

/**
 * The admin panel's sections, in sidebar order. Bookings, drivers,
 * customers, reviews and settings join as their modules are built.
 */
const SECTIONS = [
  { href: '/vehicles', label: 'Vehicles' },
  { href: '/vehicle-types', label: 'Vehicle types' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/system-status', label: 'System status' },
];

const ROLE_LABEL: Record<StaffUser['role'], string> = {
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
};

/**
 * Every signed-in admin page: the staff check once, then a sidebar on the
 * left (a row of links on a phone) and the page beside it.
 */
export function PanelShell({ children }: { children: React.ReactNode }) {
  return <StaffGate>{(user) => <Frame user={user}>{children}</Frame>}</StaffGate>;
}

function Frame({ user, children }: { user: StaffUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useStaffLogout();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 pt-4 pb-16 sm:px-6 lg:flex-row lg:gap-8 lg:pt-6">
      <aside className="lg:sticky lg:top-6 lg:w-60 lg:shrink-0 lg:self-start">
        <div className="glass space-y-5 rounded-3xl! p-4">
          <Link href="/vehicles" className="flex min-h-11 items-center gap-2.5 px-2 font-semibold">
            <span
              aria-hidden="true"
              className="lift flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-accent to-accent-2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M7 5v8a5 5 0 0 0 10 0V5"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            UkRide admin
          </Link>

          <nav aria-label="Admin sections">
            <ul className="flex flex-wrap gap-1 lg:flex-col">
              {SECTIONS.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href} className="shrink-0">
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                        active
                          ? 'bg-glass-strong text-ink'
                          : 'text-ink-muted hover:bg-glass hover:text-ink'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-between gap-3 border-t border-line px-2 pt-4 lg:flex-col lg:items-start">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-ink-muted">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                logout.mutate(undefined, { onSettled: () => router.replace('/login') })
              }
              disabled={logout.isPending}
              className="btn btn-ghost min-h-11! px-4! py-0! text-sm lg:w-full"
            >
              {logout.isPending ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Signing out
                </>
              ) : (
                'Sign out'
              )}
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
