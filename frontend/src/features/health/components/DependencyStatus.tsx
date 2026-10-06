'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useReadiness } from '../hooks/useReadiness';
import type { DependencyCheck } from '../types';
import { Detail } from './SystemStatus';

/** The dependencies shown, in display order. Keys match `checks` in the API answer. */
const dependencies = [
  { key: 'database', label: 'Database' },
  { key: 'redis', label: 'Redis' },
];

function CheckBadge({ check }: { check?: DependencyCheck }) {
  if (check?.status === 'up') return <Badge variant="success">Up</Badge>;
  if (check?.status === 'down') return <Badge variant="danger">Down</Badge>;
  if (check?.status === 'skipped') return <Badge>Not used yet</Badge>;
  return <Badge>Unknown</Badge>;
}

export function DependencyStatus() {
  const { data, isPending, isError } = useReadiness();

  // First check has not finished yet.
  if (isPending) {
    return (
      <Card>
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm text-ink-muted">Checking the database</p>
        </div>
      </Card>
    );
  }

  const isDown = !isError && data.status === 'not_ready';

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dependencies</h2>

        {/* The wrapper announces changes; the list keeps its own semantics. */}
        <div role="status">
          <dl className="divide-y divide-line border-y border-line">
            {dependencies.map(({ key, label }) => (
              <Detail key={key} label={label}>
                {/* Detail values are monospace; a status label is interface text. */}
                <span className="font-sans">
                  <CheckBadge check={isError ? undefined : data.checks[key]} />
                </span>
              </Detail>
            ))}
          </dl>
        </div>

        {isError ? (
          <p className="text-sm leading-relaxed text-ink-muted">
            Shown when the API can be reached.
          </p>
        ) : null}

        {isDown ? (
          <p role="alert" className="text-sm leading-relaxed">
            The API is running but cannot reach a dependency marked Down. Requests that read or save
            data will fail until it is back. This page will recover on its own.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
