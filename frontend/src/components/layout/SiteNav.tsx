'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMe } from '@/features/auth/hooks/useMe';

/** A floating glass bar that stays at the top while the page scrolls. */
export function SiteNav() {
  const pathname = usePathname();
  const { data: user } = useMe();

  const link = (href: string, label: string, className = '') => {
    // A section stays highlighted on its own sub-pages: /account covers /account/edit.
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex min-h-11 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
          active ? 'bg-glass-strong text-ink' : 'text-ink-muted hover:bg-glass hover:text-ink'
        } ${className}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-3 z-30 px-3 sm:top-4 sm:px-6">
      <nav
        aria-label="Main"
        className="glass mx-auto flex w-full max-w-5xl items-center justify-between gap-2 rounded-full! py-1.5 pr-1.5 pl-5"
      >
        <Link href="/" className="flex min-h-11 items-center gap-2.5 text-base font-semibold">
          <span
            aria-hidden="true"
            className="lift flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-accent to-accent-2"
          >
            {/* The mark: a "U" drawn as one stroke, like a road that turns back. */}
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M7 5v8a5 5 0 0 0 10 0V5"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          UkRide
        </Link>

        <div className="flex items-center gap-1">
          {/* On a phone there is no room for these; the home page links to both. */}
          {link('/vehicles', 'Vehicles', 'max-sm:hidden')}
          {link('/system-status', 'Status', 'max-md:hidden')}

          {user ? (
            // Signed in: one way into the account, named after the person.
            link('/account', user.firstName)
          ) : (
            // Signed out, or still checking: the two ways in. Sign up is a glass
            // pill, not the accent: the accent belongs to each page's own main
            // action. On the sign-up page it is only a marker of where you are.
            <>
              {link('/login', 'Sign in')}
              {pathname === '/register' ? (
                link('/register', 'Sign up')
              ) : (
                <Link
                  href="/register"
                  className="btn btn-ghost min-h-11! rounded-full! px-5! py-0! text-sm whitespace-nowrap"
                >
                  Sign up
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
