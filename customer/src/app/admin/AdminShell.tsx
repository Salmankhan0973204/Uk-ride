'use client';

import { AdminNav } from '@/components/layout/AdminNav';
import { AdminGate } from '@/features/auth/components/AdminGate';

/**
 * Every page under /admin goes through here: the admin check once, then the
 * admin menu above the page. The pages themselves need no guard of their own.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      {() => (
        <div className="space-y-5 pt-2 sm:pt-6">
          <AdminNav />
          {children}
        </div>
      )}
    </AdminGate>
  );
}
