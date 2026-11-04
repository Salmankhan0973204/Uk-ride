import type { Metadata } from 'next';
import { NewAirportForm } from '@/features/airports/components/AirportForm';

export const metadata: Metadata = {
  title: 'Add an airport',
  description: 'Add an airport UkRide serves.',
};

export default function Page() {
  return <NewAirportForm />;
}
