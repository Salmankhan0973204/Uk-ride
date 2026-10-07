'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useHealth } from '../hooks/useHealth';
import { useReadiness } from '../hooks/useReadiness';

/** A small live read-out for the home page, from the same queries as the status page. */
export function StatusSummary() {
  const health = useHealth();
  const readiness = useReadiness();

  const api = health.isPending ? (
    <Badge>Checking</Badge>
  ) : health.isError ? (
    <Badge variant="danger">Offline</Badge>
  ) : (
    <Badge variant="success">Online</Badge>
  );

  const databaseStatus = health.isError ? undefined : readiness.data?.checks.database?.status;
  const database =
    databaseStatus === 'up' ? (
      <Badge variant="success">Up</Badge>
    ) : databaseStatus === 'down' ? (
      <Badge variant="danger">Down</Badge>
    ) : (
      <Badge>{readiness.isPending && !health.isError ? 'Checking' : 'Unknown'}</Badge>
    );

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Live system status</h2>
          <p className="text-sm text-ink-muted">Checked every 10 seconds.</p>
        </div>

        <dl role="status" className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5">
            <dt className="text-sm text-ink-muted">API</dt>
            <dd>{api}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <dt className="text-sm text-ink-muted">Database</dt>
            <dd>{database}</dd>
          </div>
        </dl>

        <Link href="/system-status" className="btn btn-ghost min-h-11! text-sm">
          View details
        </Link>
      </div>
    </Card>
  );
}
