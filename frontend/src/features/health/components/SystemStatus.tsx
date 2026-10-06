'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { API_BASE_URL } from '@/lib/api/client';
import { useHealth } from '../hooks/useHealth';

function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTime(value: number | string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-right font-mono text-sm break-all">{children}</dd>
    </div>
  );
}

export function SystemStatus() {
  const { data, error, isPending, isError, isFetching, dataUpdatedAt, errorUpdatedAt, refetch } =
    useHealth();

  // First check has not finished yet.
  if (isPending) {
    return (
      <Card>
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm text-ink-muted">Checking the API</p>
        </div>
      </Card>
    );
  }

  // The API could not be reached or answered with an error.
  if (isError) {
    return (
      <Card>
        <div role="alert" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">API</h2>
            <Badge variant="danger">Offline</Badge>
          </div>

          <p className="text-sm leading-relaxed">
            {error.isNetworkError
              ? 'The web app cannot reach the API. Start the backend and this page will recover on its own.'
              : error.message}
          </p>

          <dl className="divide-y divide-line border-y border-line">
            <Detail label="Address">{API_BASE_URL}</Detail>
            <Detail label="Error code">{error.code}</Detail>
            {error.requestId ? <Detail label="Request ID">{error.requestId}</Detail> : null}
            <Detail label="Last tried">{formatTime(errorUpdatedAt)}</Detail>
          </dl>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching ? 'Trying again' : 'Try again'}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">API</h2>
          <div role="status">
            <Badge variant="success">Online</Badge>
          </div>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          <Detail label="Service">{data.service}</Detail>
          <Detail label="Version">{data.version}</Detail>
          <Detail label="Environment">{data.env}</Detail>
          <Detail label="Uptime">{formatUptime(data.uptimeSeconds)}</Detail>
          <Detail label="Address">{API_BASE_URL}</Detail>
        </dl>

        <p className="text-sm text-ink-muted">
          {isFetching ? 'Checking now' : `Last checked at ${formatTime(dataUpdatedAt)}`}
        </p>
      </div>
    </Card>
  );
}
