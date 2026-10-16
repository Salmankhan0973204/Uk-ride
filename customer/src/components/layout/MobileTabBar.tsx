'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isActive } from './navItems';
import type { NavIcon } from './navItems';

/** Line icons drawn in the current text colour. Words always sit under them. */
const ICONS: Record<NavIcon, React.ReactNode> = {
  home: <path d="M4 11l8-7 8 7M6 9.5V20h12V9.5" />,
  tag: (
    <>
      <path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z" />
      <circle cx="8" cy="8.5" r="1.4" />
    </>
  ),
  car: (
    <>
      <path d="M5 16V11.5L7 6.5h10l2 5V16M3.5 16h17" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c.9-3.6 3.6-5.5 7-5.5s6.1 1.9 7 5.5" />
    </>
  ),
};

/**
 * The bar fixed to the bottom of a phone screen, as on ukride.uk. From 640px
 * up it is hidden and the floating header carries the same links.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="glass menu fixed inset-x-3 bottom-3 z-30 rounded-2xl! px-1.5 py-1.5 sm:hidden"
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[0.72rem] font-medium transition-colors duration-200 ${
                  active ? 'bg-glass-strong text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {ICONS[icon]}
                </svg>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
