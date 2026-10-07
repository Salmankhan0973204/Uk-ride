import type { Metadata } from 'next';
import { AccountPanel } from '@/features/auth/components/AccountPanel';

export const metadata: Metadata = {
  title: 'Your account',
  description: 'Your UkRide account details.',
};

export default function AccountPage() {
  return (
    <div className="pt-2 sm:pt-6">
      <AccountPanel />
    </div>
  );
}
