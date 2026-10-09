import type { Metadata } from 'next';
import { EditVehicleTypeForm } from '@/features/vehicle-types/components/VehicleTypeForm';

export const metadata: Metadata = {
  title: 'Edit a vehicle type',
  description: 'Change a class of car in the UkRide catalogue.',
};

export default function Page() {
  return (
    <div className="pt-2 sm:pt-6">
      <EditVehicleTypeForm />
    </div>
  );
}
