'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/system-status', label: 'System status' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-surface">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex min-h-14 items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-accent" />
          UkRide
        </Link>

        <ul className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center rounded-md px-3 text-sm transition-colors ${
                    active
                      ? 'font-medium text-ink'
                      : 'text-ink-muted hover:bg-neutral-soft hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
