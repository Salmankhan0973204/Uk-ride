import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your UkRide account.',
};

export default function LoginPage() {
  return (
    <div className="pt-2 sm:pt-6">
      <LoginForm />
    </div>
  );
}
