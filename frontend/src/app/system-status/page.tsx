import type { Metadata } from 'next';
import { DependencyStatus } from '@/features/health/components/DependencyStatus';
import { SystemStatus } from '@/features/health/components/SystemStatus';

export const metadata: Metadata = {
  title: 'System status',
  description: 'Live availability of the UkRide API and its database.',
};

export default function SystemStatusPage() {
  return (
    <div className="space-y-8 pt-4 sm:pt-8">
      <div className="rise space-y-3">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          System status
        </h1>
        <p className="text-lg leading-relaxed text-ink-muted">
          Checks the API and its database every 10 seconds and updates on its own.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SystemStatus />
        <DependencyStatus />
      </div>
    </div>
  );
}
