import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a UkRide account with an email address and a password.',
};

export default function RegisterPage() {
  return (
    <div className="max-w-md">
      <RegisterForm />
    </div>
  );
}
