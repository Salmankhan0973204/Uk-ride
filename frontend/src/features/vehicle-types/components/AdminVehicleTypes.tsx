'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { AdminGate } from '@/features/auth/components/AdminGate';
import { useAdminVehicleTypes } from '../hooks/useAdminVehicleTypes';
import type { AdminVehicleType } from '../types';
import { plural } from './VehicleCatalogue';

/** What the page says after coming back from one of its forms. */
const DONE: Record<string, string> = {
  created: 'The vehicle type has been added.',
  updated: 'The vehicle type has been updated.',
};

export function AdminVehicleTypes() {
  return <AdminGate>{() => <Table />}</AdminGate>;
}

function Table() {
  const done = DONE[useSearchParams().get('done') ?? ''];
  const {
    data: vehicleTypes,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useAdminVehicleTypes();

  return (
    <Card className="rise">
      <div className="space-y-7">
        {done ? (
          <p
            role="status"
            className="rounded-2xl border border-success/50 bg-[rgb(110_231_183/0.12)] px-4 py-3 text-sm leading-relaxed font-medium"
          >
            {done}
          </p>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="space-y-2">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Vehicle types
            </h1>
            <p className="max-w-[52ch] text-base leading-relaxed text-ink-muted">
              The classes of car customers can choose. A type that is switched off stays here and is
              hidden from the public list.
            </p>
          </div>
          {/* The one accent button of the page. */}
          <Link href="/admin/vehicle-types/new" className="btn btn-primary max-sm:w-full">
            Add vehicle type
          </Link>
        </div>

        {isPending ? (
          <div role="status" className="flex items-center gap-3 border-t border-line pt-6">
            <Spinner />
            <p className="text-base text-ink-muted">Loading the vehicle types</p>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-4 border-t border-line pt-6">
            <p className="text-base leading-relaxed">
              {error.status === 403
                ? 'Your account is no longer allowed to manage vehicle types.'
                : error.isNetworkError
                  ? 'We could not reach the server. Try again in a moment.'
                  : 'We could not load the vehicle types. Try again in a moment.'}
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
        ) : vehicleTypes.length === 0 ? (
          <p className="border-t border-line pt-6 text-base leading-relaxed text-ink-muted">
            There are no vehicle types yet. Add the first one.
          </p>
        ) : (
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Every vehicle type, in list order</caption>
            <thead>
              <tr className="border-y border-line text-sm text-ink-muted">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium max-md:hidden">
                  Passengers
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium max-md:hidden">
                  Suitcases
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium max-lg:hidden">
                  Order
                </th>
                <th scope="col" className="px-4 py-3 font-medium max-sm:hidden">
                  Status
                </th>
                <th scope="col" className="py-3 pl-4 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="tabular divide-y divide-line border-b border-line">
              {vehicleTypes.map((type) => (
                <Row key={type.id} type={type} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function Status({ type }: { type: AdminVehicleType }) {
  return type.isActive ? <Badge variant="success">On offer</Badge> : <Badge>Switched off</Badge>;
}

function Row({ type }: { type: AdminVehicleType }) {
  return (
    <tr className="align-top">
      <th scope="row" className="py-4 pr-4 font-normal">
        <div className="space-y-1">
          <p className={`font-semibold break-words ${type.isActive ? '' : 'text-ink-muted'}`}>
            {type.name}
          </p>
          <p className="font-mono text-sm break-all text-ink-muted">{type.slug}</p>
          {/* On narrow screens the columns fold into the first cell. */}
          <p className="text-sm text-ink-muted md:hidden">
            {plural(type.passengers, 'passenger')}, {plural(type.suitcases, 'suitcase')}
          </p>
          <div className="pt-1 sm:hidden">
            <Status type={type} />
          </div>
        </div>
      </th>
      <td className="px-4 py-4 text-right max-md:hidden">{type.passengers}</td>
      <td className="px-4 py-4 text-right max-md:hidden">{type.suitcases}</td>
      <td className="px-4 py-4 text-right text-ink-muted max-lg:hidden">{type.sortOrder}</td>
      <td className="px-4 py-4 max-sm:hidden">
        <Status type={type} />
      </td>
      <td className="py-3 pl-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/admin/vehicle-types/${type.id}/edit`}
            aria-label={`Edit ${type.name}`}
            className="btn btn-ghost min-h-11! px-4! py-0! text-sm"
          >
            Edit
          </Link>
        </div>
      </td>
    </tr>
  );
}
