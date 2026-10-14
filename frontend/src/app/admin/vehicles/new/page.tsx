import type { Metadata } from 'next';
import { NewVehicleForm } from '@/features/vehicles/components/VehicleForm';

export const metadata: Metadata = {
  title: 'Add a vehicle',
  description: 'Add a car to the UkRide fleet.',
};

export default function Page() {
  return <NewVehicleForm />;
}
