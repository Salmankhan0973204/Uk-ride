import type { Metadata } from 'next';
import { EditAirportForm } from '@/features/airports/components/AirportForm';

export const metadata: Metadata = {
  title: 'Edit an airport',
  description: 'Change an airport UkRide serves.',
};

export default function Page() {
  return <EditAirportForm />;
}
