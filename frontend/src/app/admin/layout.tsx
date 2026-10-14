import { AdminShell } from './AdminShell';

/** A layout wraps every page below it, so the admin check cannot be forgotten on a new page. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
