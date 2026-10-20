import type { Metadata } from 'next';
import { ChangeMobileForm } from '@/features/profile/components/ChangeMobileForm';

export const metadata: Metadata = {
  title: 'Change your mobile',
  description: 'Change the mobile number on your UkRide account with a code sent to the new one.',
};

export default function ChangeMobilePage() {
  return (
    <div className="pt-2 sm:pt-6">
      <ChangeMobileForm />
    </div>
  );
}
