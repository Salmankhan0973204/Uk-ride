import type { Metadata } from 'next';
import { PricingForm } from '@/features/pricing/components/PricingForm';

export const metadata: Metadata = {
  title: 'Set prices',
  description: 'Set the prices of a UkRide vehicle type.',
};

export default function Page() {
  return <PricingForm />;
}
