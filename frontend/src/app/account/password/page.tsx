import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm';

export const metadata: Metadata = {
  title: 'Change your password',
  description: 'Change the password of your UkRide account.',
};

export default function ChangePasswordPage() {
  return (
    <div className="pt-2 sm:pt-6">
      <ChangePasswordForm />
    </div>
  );
}
