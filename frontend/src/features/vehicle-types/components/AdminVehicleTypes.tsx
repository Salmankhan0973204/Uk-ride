'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { AdminGate } from '@/features/auth/components/AdminGate';
import type { ApiError } from '@/lib/api/client';
import {
  useAdminVehicleTypes,
  useDeactivateVehicleType,
  useUpdateVehicleType,
} from '../hooks/useAdminVehicleTypes';
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

const COLUMNS = 6;
const COMPACT = 'btn btn-ghost min-h-11! px-4! py-0! text-sm';

const problem = (error: ApiError, doing: string) =>
  error.isNetworkError
    ? `We could not reach the server, so nothing was ${doing}. Try again.`
    : error.status === 403
      ? 'Your account is not allowed to change vehicle types.'
      : `We could not do that. Nothing was ${doing}. Try again in a moment.`;

/**
 * One vehicle type. Switching it off hides it from customers, so the button
 * first opens a question under the row, and only the answer does it.
 * Switching it back on harms nobody, so that happens at once.
 */
function Row({ type }: { type: AdminVehicleType }) {
  const questionId = useId();
  const [confirming, setConfirming] = useState(false);
  const off = useDeactivateVehicleType();
  const on = useUpdateVehicleType();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onRef = useRef<HTMLButtonElement>(null);

  // The button that was pressed is replaced by its opposite. Focus follows
  // it, so a keyboard user is not dropped back at the top of the page.
  const focusNext = (ref: React.RefObject<HTMLButtonElement | null>) =>
    requestAnimationFrame(() => ref.current?.focus());

  // Opening the question moves focus into it, so a keyboard or screen reader
  // user lands on the answer and hears the question it belongs to.
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  function ask() {
    on.reset();
    off.reset();
    setConfirming(true);
  }

  function cancel() {
    setConfirming(false);
    off.reset();
    // Back to where the person was.
    focusNext(triggerRef);
  }

  const failure = off.error ? problem(off.error, 'switched off') : undefined;
  const onFailure = on.error ? problem(on.error, 'switched on') : undefined;

  return (
    <>
      <tr className="align-top">
        <th scope="row" className="py-4 pr-4 font-normal">
          <div className="space-y-1">
            <p className={`font-semibold break-words ${type.isActive ? '' : 'text-ink-muted'}`}>
              {type.name}
            </p>
            <p className="font-mono text-sm break-all text-ink-muted">{type.slug}</p>
            {/* On narrow screens the columns fold into the first cell. */}
            <p className="text-sm text-ink-muted md:hidden">
              <span className="whitespace-nowrap">{plural(type.passengers, 'passenger')},</span>{' '}
              <span className="whitespace-nowrap">{plural(type.suitcases, 'suitcase')}</span>
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
              className={COMPACT}
            >
              Edit
            </Link>
            {type.isActive ? (
              <button
                ref={triggerRef}
                type="button"
                onClick={ask}
                aria-expanded={confirming}
                aria-label={`Switch off ${type.name}`}
                className={COMPACT}
              >
                Switch off
              </button>
            ) : (
              <button
                type="button"
                ref={onRef}
                onClick={() =>
                  on.mutate(
                    { id: type.id, changes: { isActive: true } },
                    { onSuccess: () => focusNext(triggerRef) },
                  )
                }
                disabled={on.isPending}
                aria-label={`Switch on ${type.name}`}
                className={COMPACT}
              >
                {on.isPending ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Switching on
                  </>
                ) : (
                  'Switch on'
                )}
              </button>
            )}
          </div>
        </td>
      </tr>

      {confirming && type.isActive ? (
        <tr>
          <td colSpan={COLUMNS} className="pb-4">
            <div
              role="group"
              aria-labelledby={questionId}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !off.isPending) cancel();
              }}
              className="pop space-y-3 rounded-2xl border border-warning/50 bg-[rgb(252_211_77/0.12)] px-4 py-3"
            >
              <p id={questionId} className="text-sm leading-relaxed">
                <span className="font-semibold">Switch off {type.name}?</span> Customers will no
                longer see it. You can switch it back on at any time.
              </p>
              {failure ? (
                <p role="alert" className="text-sm font-medium text-danger">
                  {failure}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={() =>
                    off.mutate(type.id, {
                      onSuccess: () => {
                        setConfirming(false);
                        focusNext(onRef);
                      },
                    })
                  }
                  disabled={off.isPending}
                  aria-describedby={questionId}
                  className={COMPACT}
                >
                  {off.isPending ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Switching off
                    </>
                  ) : (
                    'Yes, switch it off'
                  )}
                </button>
                <button type="button" onClick={cancel} disabled={off.isPending} className={COMPACT}>
                  Keep it on
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}

      {onFailure ? (
        <tr>
          <td colSpan={COLUMNS} className="pb-4">
            <p role="alert" className="text-sm font-medium text-danger">
              {onFailure}
            </p>
          </td>
        </tr>
      ) : null}
    </>
  );
}
