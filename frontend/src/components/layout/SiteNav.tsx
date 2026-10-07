'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMe } from '@/features/auth/hooks/useMe';

/** A floating glass bar that stays at the top while the page scrolls. */
export function SiteNav() {
  const pathname = usePathname();
  const { data: user } = useMe();

  const link = (href: string, label: string, className = '') => {
    const active = pathname === href;
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
            className="h-6 w-6 rounded-lg bg-linear-to-br from-accent to-accent-2 shadow-[0_0_18px_rgb(139_92_246/0.8)]"
          />
          UkRide
        </Link>

        <div className="flex items-center gap-1">
          {/* On a phone there is no room for it; the home page links to it. */}
          {link('/system-status', 'Status', 'max-sm:hidden')}

          {user ? (
            // Signed in: one way into the account, named after the person.
            link('/account', user.firstName)
          ) : (
            // Signed out, or still checking: the two ways in. On the sign-up
            // page itself the button would only repeat the form's own action.
            <>
              {link('/login', 'Sign in')}
              {pathname === '/register' ? (
                link('/register', 'Sign up')
              ) : (
                <Link
                  href="/register"
                  className="btn btn-primary min-h-11! rounded-full! px-5! text-sm whitespace-nowrap"
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
