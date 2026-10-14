'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useAdminVehicleTypes } from '@/features/vehicle-types/hooks/useAdminVehicleTypes';
import { toQueryString } from '../api/vehicles.api';
import { formatRegistration, statusLabel } from '../format';
import { useVehicles } from '../hooks/useVehicles';
import { VEHICLE_STATUSES } from '../types';
import type { Vehicle, VehicleListQuery, VehicleStatus } from '../types';

const LIST = '/admin/vehicles';

/**
 * The filters live in the address (`?page=2&status=MAINTENANCE`), not only in
 * state. A reload keeps them, the back button undoes them, and a filtered
 * list can be shared as a link.
 */
function useListQuery(): VehicleListQuery {
  const params = useSearchParams();
  const page = Number(params.get('page'));
  const status = params.get('status');
  return {
    page: Number.isInteger(page) && page > 1 ? page : 1,
    status: VEHICLE_STATUSES.some((option) => option.value === status)
      ? (status as VehicleStatus)
      : undefined,
    type: params.get('type') || undefined,
    search: params.get('search')?.trim() || undefined,
  };
}

const STATUS_BADGE = {
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  RETIRED: 'neutral',
} as const;

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge variant={STATUS_BADGE[status]}>{statusLabel(status)}</Badge>;
}

export function AdminVehicles() {
  const query = useListQuery();
  const { data, isPending, isError, error, isPlaceholderData, refetch, isFetching } =
    useVehicles(query);
  const filtered = Boolean(query.status || query.type || query.search);

  return (
    <Card className="rise">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Vehicles
          </h1>
          <p className="max-w-[52ch] text-base leading-relaxed text-ink-muted">
            Every car in the fleet. Search by registration, make or model.
          </p>
        </div>

        {/* The key resets the search box when the address changes from outside it. */}
        <Filters key={query.search ?? ''} query={query} />

        {isPending ? (
          <div role="status" className="flex items-center gap-3 border-t border-line pt-6">
            <Spinner />
            <p className="text-base text-ink-muted">Loading the vehicles</p>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-4 border-t border-line pt-6">
            <p className="text-base leading-relaxed">
              {error.status === 403
                ? 'Your account is no longer allowed to manage vehicles.'
                : error.isNetworkError
                  ? 'We could not reach the server. Try again in a moment.'
                  : 'We could not load the vehicles. Try again in a moment.'}
            </p>
            {error.status === 403 ? null : (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="btn btn-ghost"
              >
                {isFetching ? 'Trying again' : 'Try again'}
              </button>
            )}
          </div>
        ) : data.meta.total === 0 ? (
          <div className="space-y-4 border-t border-line pt-6">
            <p className="text-base leading-relaxed text-ink-muted">
              {filtered ? 'No vehicles match these filters.' : 'There are no vehicles yet.'}
            </p>
            {filtered ? (
              <Link href={LIST} className="btn btn-ghost">
                Clear the filters
              </Link>
            ) : null}
          </div>
        ) : data.vehicles.length === 0 ? (
          // An old link to a page that no longer exists, after vehicles were filtered or removed.
          <div className="space-y-4 border-t border-line pt-6">
            <p className="text-base leading-relaxed text-ink-muted">
              There is no page {query.page}. The list has {data.meta.totalPages}{' '}
              {data.meta.totalPages === 1 ? 'page' : 'pages'}.
            </p>
            <Link
              href={LIST + toQueryString({ ...query, page: data.meta.totalPages })}
              className="btn btn-ghost"
            >
              Go to the last page
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <table
              aria-busy={isPlaceholderData}
              className={`w-full border-collapse text-left transition-opacity duration-200 ${
                isPlaceholderData ? 'opacity-60' : ''
              }`}
            >
              <caption className="sr-only">Vehicles, sorted by registration</caption>
              <thead>
                <tr className="border-y border-line text-sm text-ink-muted">
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Registration
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium max-sm:hidden">
                    Vehicle
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium max-md:hidden">
                    Type
                  </th>
                  <th scope="col" className="py-3 pl-4 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-b border-line">
                {data.vehicles.map((vehicle) => (
                  <Row key={vehicle.id} vehicle={vehicle} />
                ))}
              </tbody>
            </table>

            <Pages query={query} meta={data.meta} loading={isPlaceholderData} />
          </div>
        )}
      </div>
    </Card>
  );
}

function Row({ vehicle }: { vehicle: Vehicle }) {
  const details = `${vehicle.colour}, ${vehicle.year}`;
  return (
    <tr className="align-top">
      <th scope="row" className="py-4 pr-4 font-normal">
        <div className="space-y-1">
          {/* A plate is read character by character, so it is set in the mono face. */}
          <p className="font-mono font-semibold tracking-wide whitespace-nowrap">
            {formatRegistration(vehicle.registration)}
          </p>
          {/* On narrow screens the hidden columns fold in here. */}
          <p className="text-sm text-ink-muted sm:hidden">
            {vehicle.make} {vehicle.model}, {details}
          </p>
          <p className="text-sm text-ink-muted md:hidden">{vehicle.vehicleType.name}</p>
        </div>
      </th>
      <td className="px-4 py-4 max-sm:hidden">
        <p className="font-medium break-words">
          {vehicle.make} {vehicle.model}
        </p>
        <p className="text-sm text-ink-muted">{details}</p>
      </td>
      <td className="px-4 py-4 max-md:hidden">{vehicle.vehicleType.name}</td>
      <td className="py-4 pl-4">
        <StatusBadge status={vehicle.status} />
      </td>
    </tr>
  );
}

/** The search box and the two dropdowns. Every change goes into the address. */
function Filters({ query }: { query: VehicleListQuery }) {
  const router = useRouter();
  const formId = useId();
  const [search, setSearch] = useState(query.search ?? '');
  const types = useAdminVehicleTypes();

  // Any change of filter starts again from page 1: page 4 of the old list
  // means nothing in the new one.
  const go = (changes: VehicleListQuery) =>
    router.push(LIST + toQueryString({ ...query, ...changes, page: 1 }));

  const typeOptions = (types.data ?? []).map((type) => ({ value: type.slug, label: type.name }));

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        go({ search: search.trim() || undefined });
      }}
      className="grid gap-4 border-t border-line pt-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end"
    >
      <div className="space-y-2">
        <label htmlFor={`${formId}-search`} className="block text-sm font-medium">
          Search
        </label>
        <div className="flex gap-2">
          <input
            id={`${formId}-search`}
            type="search"
            name="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="AB12 CDE, Skoda, Octavia"
            autoComplete="off"
            className="control min-w-0"
          />
          <button type="submit" className="btn btn-ghost shrink-0">
            Search
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p id={`${formId}-status-label`} className="text-sm font-medium">
          Status
        </p>
        <Select
          id={`${formId}-status`}
          name="status"
          labelId={`${formId}-status-label`}
          value={query.status ?? ''}
          options={VEHICLE_STATUSES}
          onChange={(value) => go({ status: value || undefined })}
          placeholder="Any status"
          clearLabel="Any status"
        />
      </div>

      <div className="space-y-2">
        <p id={`${formId}-type-label`} className="text-sm font-medium">
          Vehicle type
        </p>
        <Select
          id={`${formId}-type`}
          name="type"
          labelId={`${formId}-type-label`}
          value={query.type ?? ''}
          options={typeOptions}
          onChange={(value) => go({ type: value || undefined })}
          placeholder="Any type"
          clearLabel="Any type"
        />
      </div>
    </form>
  );
}

/** "21 to 25 of 25", with links to the pages on either side. */
function Pages({
  query,
  meta,
  loading,
}: {
  query: VehicleListQuery;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  loading: boolean;
}) {
  const first = (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);
  const href = (page: number) => LIST + toQueryString({ ...query, page });
  const step = 'btn btn-ghost min-h-11! px-4! py-0! text-sm';

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <p className="tabular text-sm text-ink-muted" aria-live="polite">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            Loading page {query.page}
          </span>
        ) : (
          <>
            {first} to {last} of {meta.total} vehicles
            {meta.totalPages > 1 ? `, page ${meta.page} of ${meta.totalPages}` : ''}
          </>
        )}
      </p>
      {meta.totalPages > 1 ? (
        <div className="flex gap-2">
          {meta.page > 1 ? (
            <Link href={href(meta.page - 1)} className={step}>
              Previous
            </Link>
          ) : (
            <span aria-hidden="true" className={`${step} opacity-40`}>
              Previous
            </span>
          )}
          {meta.page < meta.totalPages ? (
            <Link href={href(meta.page + 1)} className={step}>
              Next
            </Link>
          ) : (
            <span aria-hidden="true" className={`${step} opacity-40`}>
              Next
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
