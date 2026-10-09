import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AccountPanel } from '@/features/auth/components/AccountPanel';

export const metadata: Metadata = {
  title: 'Your account',
  description: 'Your UkRide profile.',
};

export default function AccountPage() {
  return (
    <div className="pt-2 sm:pt-6">
      {/* The panel reads "?done=" from the address, which is only known in the
          browser. Suspense lets the rest of the page be prebuilt. */}
      <Suspense fallback={null}>
        <AccountPanel />
      </Suspense>
    </div>
  );
}
