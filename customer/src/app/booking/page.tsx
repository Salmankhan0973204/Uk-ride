import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingPage } from '@/features/booking/components/BookingPage';

export const metadata: Metadata = {
  title: 'Book your journey',
  description: 'The exact price of your journey in every UkRide car, with the breakdown.',
};

export default function Page() {
  return (
    // The journey is read from the address, which is only known in the browser.
    <Suspense fallback={null}>
      <BookingPage />
    </Suspense>
  );
}
