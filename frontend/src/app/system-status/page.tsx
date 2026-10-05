import type { Metadata } from 'next';
import { SystemStatus } from '@/features/health/components/SystemStatus';

export const metadata: Metadata = {
  title: 'System status',
  description: 'Live availability of the UkRide API.',
};

export default function SystemStatusPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">System status</h1>
        <p className="text-sm leading-relaxed text-ink-muted">
          Checks the API every 10 seconds and updates on its own.
        </p>
      </div>

      <SystemStatus />
    </div>
  );
}
