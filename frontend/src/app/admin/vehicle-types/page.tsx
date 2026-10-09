import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminVehicleTypes } from '@/features/vehicle-types/components/AdminVehicleTypes';

export const metadata: Metadata = {
  title: 'Vehicle types',
  description: 'Manage the classes of car customers can choose.',
};

export default function Page() {
  return (
    <div className="pt-2 sm:pt-6">
      {/* The table reads "?done=" from the address, which is only known in the browser. */}
      <Suspense fallback={null}>
        <AdminVehicleTypes />
      </Suspense>
    </div>
  );
}
