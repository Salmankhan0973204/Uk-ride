'use client';

import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useVehicleTypes } from '../hooks/useVehicleTypes';

/** "1 passenger", "4 passengers". */
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** The public catalogue. One panel; each vehicle type is a row in it. */
export function VehicleCatalogue() {
  const { data: vehicleTypes, isPending, isError, error, refetch, isFetching } = useVehicleTypes();

  return (
    <Card className="rise mx-auto max-w-3xl">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Our vehicles
          </h1>
          <p className="max-w-[56ch] text-base leading-relaxed text-ink-muted">
            Choose by how many people are travelling and how much luggage you have.
          </p>
        </div>

        {isPending ? (
          <div role="status" className="flex items-center gap-3 border-t border-line pt-6">
            <Spinner />
            <p className="text-base text-ink-muted">Loading the vehicles</p>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-4 border-t border-line pt-6">
            <p className="text-base leading-relaxed">
              {error.isNetworkError
                ? 'We could not reach the server, so the vehicles cannot be shown.'
                : 'We could not load the vehicles.'}{' '}
              Try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn btn-primary"
            >
              {isFetching ? (
                <>
                  <Spinner />
                  Trying again
                </>
              ) : (
                'Try again'
              )}
            </button>
          </div>
        ) : vehicleTypes.length === 0 ? (
          <p className="border-t border-line pt-6 text-base leading-relaxed text-ink-muted">
            No vehicles are listed yet. Check back soon.
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {vehicleTypes.map((type) => (
              <li
                key={type.id}
                className="grid gap-x-8 gap-y-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight break-words">{type.name}</h2>
                  <p className="leading-relaxed text-ink-muted">{type.description}</p>
                </div>
                <dl className="tabular flex gap-x-6 text-sm sm:flex-col sm:items-end sm:gap-y-1">
                  <div>
                    <dt className="sr-only">Seats</dt>
                    <dd className="font-medium">{plural(type.passengers, 'passenger')}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Luggage</dt>
                    <dd className="text-ink-muted">{plural(type.suitcases, 'suitcase')}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm leading-relaxed text-ink-muted">
          Prices are not published yet, and booking has not opened.
        </p>
      </div>
    </Card>
  );
}
