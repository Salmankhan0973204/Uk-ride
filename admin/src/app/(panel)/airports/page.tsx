import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminAirports } from '@/features/airports/components/AdminAirports';

export const metadata: Metadata = {
  title: 'Airports',
  description: 'The airports UkRide serves and the postcodes that count as each one.',
};

export default function Page() {
  return (
    // The page reads "?done=" from the address, which is only known in the browser.
    <Suspense fallback={null}>
      <AdminAirports />
    </Suspense>
  );
}
