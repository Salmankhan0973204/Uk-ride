import type { Metadata } from 'next';
import { StaffLoginForm } from '@/features/auth/components/StaffLoginForm';

export const metadata: Metadata = {
  title: 'Staff sign-in',
};

export default function StaffLoginPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pt-16 pb-16 sm:pt-24">
      <StaffLoginForm />
    </main>
  );
}
