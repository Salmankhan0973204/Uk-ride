import type { Metadata } from 'next';
import { EditVehicleForm } from '@/features/vehicles/components/VehicleForm';

export const metadata: Metadata = {
  title: 'Edit a vehicle',
  description: 'Change a car in the UkRide fleet.',
};

export default function Page() {
  return <EditVehicleForm />;
}
