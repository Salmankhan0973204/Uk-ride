import type { Metadata } from 'next';
import { NewVehicleTypeForm } from '@/features/vehicle-types/components/VehicleTypeForm';

export const metadata: Metadata = {
  title: 'Add a vehicle type',
  description: 'Add a class of car to the UkRide catalogue.',
};

export default function Page() {
  return (
    <div className="pt-2 sm:pt-6">
      <NewVehicleTypeForm />
    </div>
  );
}
