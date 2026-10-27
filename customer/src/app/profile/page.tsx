import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfilePage } from '@/features/profile/components/ProfilePage';

export const metadata: Metadata = {
  title: 'Your profile',
  description: 'Your UkRide profile: personal details, mobile number and password.',
};

export default function Page() {
  return (
    <div className="pt-2 sm:pt-6">
      {/* The page reads "?done=" from the address, which is only known in the
          browser. Suspense lets the rest of the page be prebuilt. */}
      <Suspense fallback={null}>
        <ProfilePage />
      </Suspense>
    </div>
  );
}
