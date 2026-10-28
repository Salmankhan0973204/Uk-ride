/**
 * The customer site's pages, in one list. The header, the mobile tab bar and
 * the footer all read it, so a page appears everywhere at once.
 *
 * Only pages that exist are listed. The plan (DESIGN.md, "Mobile tab bar")
 * is Home, Book Now, Journeys, Wallet, Profile:
 *   - "Prices" (/quote) becomes "Book Now" (/booking) in step 5.13
 *   - the fleet is a section of the home page (3.9), so it has no item
 *   - Journeys and Wallet join with their modules (9 and 7)
 */
export type NavIcon = 'home' | 'tag' | 'user';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Shown in the header on wide screens. Profile is not: the account link does that job. */
  inHeader: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home', inHeader: true },
  { href: '/quote', label: 'Prices', icon: 'tag', inHeader: true },
  { href: '/profile', label: 'Profile', icon: 'user', inHeader: false },
];

/** A section stays marked on its own sub-pages; Home only on the home page itself. */
export function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
