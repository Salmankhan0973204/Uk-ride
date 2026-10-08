import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Choose a new password for your UkRide account.',
};

export default function Page() {
  return (
    <div className="pt-2 sm:pt-6">
      {/* The component reads the token from the address, which is only
          known in the browser. Suspense lets the rest of the page be prebuilt. */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
