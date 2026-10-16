import Link from 'next/link';
import { NAV_ITEMS } from './navItems';

/** A quiet footer: the site's pages and the copyright line. */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6 sm:pb-10">
      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="text-ink-muted transition-colors hover:text-ink">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-muted">© {new Date().getFullYear()} UkRide</p>
      </div>
    </footer>
  );
}
