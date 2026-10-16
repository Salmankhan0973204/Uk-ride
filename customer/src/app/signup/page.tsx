import type { Metadata } from 'next';
import { SignupForm } from '@/features/auth/components/SignupForm';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create a UkRide account. We text a code to your mobile to check it is yours.',
};

export default function SignupPage() {
  return (
    <div className="pt-2 sm:pt-6">
      <SignupForm />
    </div>
  );
}
