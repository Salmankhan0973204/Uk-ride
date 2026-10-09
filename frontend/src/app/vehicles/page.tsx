import type { Metadata } from 'next';
import { VehicleCatalogue } from '@/features/vehicle-types/components/VehicleCatalogue';

export const metadata: Metadata = {
  title: 'Our vehicles',
  description: 'The classes of car you can travel in with UkRide, with seats and luggage space.',
};

export default function VehiclesPage() {
  return (
    <div className="pt-2 sm:pt-6">
      <VehicleCatalogue />
    </div>
  );
}
