'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** A floating glass bar that stays at the top while the page scrolls. */
export function SiteNav() {
  const pathname = usePathname();

  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
          active ? 'bg-glass-strong text-ink' : 'text-ink-muted hover:bg-glass hover:text-ink'
        }`}
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
          {link('/system-status', 'Status')}
          {pathname === '/register' ? (
            link('/register', 'Sign up')
          ) : (
            <Link
              href="/register"
              className="btn btn-primary min-h-11! rounded-full! px-5! text-sm"
            >
              Sign up
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
