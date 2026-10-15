import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminPricing } from '@/features/pricing/components/AdminPricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'The prices of each UkRide vehicle type.',
};

export default function Page() {
  return (
    // The page reads "?saved=" from the address, which is only known in the browser.
    <Suspense fallback={null}>
      <AdminPricing />
    </Suspense>
  );
}
