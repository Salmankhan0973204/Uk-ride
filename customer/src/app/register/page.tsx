import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a UkRide account with your name, email address and mobile number.',
};

export default function RegisterPage() {
  return (
    <div className="pt-2 sm:pt-6">
      <RegisterForm />
    </div>
  );
}
