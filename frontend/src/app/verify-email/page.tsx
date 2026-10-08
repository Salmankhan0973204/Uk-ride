import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmail } from '@/features/auth/components/VerifyEmail';

export const metadata: Metadata = {
  title: 'Confirm your email',
  description: 'Confirm the email address of your UkRide account.',
};

export default function Page() {
  return (
    <div className="pt-2 sm:pt-6">
      {/* The component reads the token from the address, which is only
          known in the browser. Suspense lets the rest of the page be prebuilt. */}
      <Suspense fallback={null}>
        <VerifyEmail />
      </Suspense>
    </div>
  );
}
