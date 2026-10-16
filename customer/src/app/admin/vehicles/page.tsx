import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminVehicles } from '@/features/vehicles/components/AdminVehicles';

export const metadata: Metadata = {
  title: 'Vehicles',
  description: 'Every car in the UkRide fleet.',
};

export default function Page() {
  return (
    // The list reads its filters from the address, which is only known in the browser.
    <Suspense fallback={null}>
      <AdminVehicles />
    </Suspense>
  );
}
