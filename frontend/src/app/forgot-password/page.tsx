import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot your password',
  description: 'Get a link to choose a new UkRide password.',
};

export default function Page() {
  return (
    <div className="pt-2 sm:pt-6">
      <ForgotPasswordForm />
    </div>
  );
}
