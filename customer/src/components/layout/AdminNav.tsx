'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin/vehicles', label: 'Vehicles' },
  { href: '/admin/vehicle-types', label: 'Vehicle types' },
  { href: '/admin/pricing', label: 'Pricing' },
];

/** Moves between the admin screens. A section stays marked on its own forms. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-wrap items-center gap-2">
      {/* On a phone the word gives way to the links; screen readers still hear it. */}
      <span className="mr-2 text-sm font-medium text-ink-muted max-sm:sr-only">Admin</span>
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              active
                ? 'border-glass-border bg-glass-strong text-ink'
                : 'border-transparent text-ink-muted hover:bg-glass hover:text-ink'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
