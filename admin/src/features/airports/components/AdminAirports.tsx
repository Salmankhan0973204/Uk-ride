'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@ukride/shared/ui/Badge';
import { Card } from '@ukride/shared/ui/Card';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { useAirports } from '../hooks/useAirports';
import type { AdminAirport } from '../types';

/** What the page says after coming back from one of its forms. */
const DONE: Record<string, string> = {
  created: 'The airport has been added.',
  updated: 'The airport has been updated.',
};

export function AdminAirports() {
  const done = DONE[useSearchParams().get('done') ?? ''];
  const { data: airports, isPending, isError, error, refetch, isFetching } = useAirports();

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
              Airports
            </h1>
            <p className="max-w-[60ch] text-base leading-relaxed text-ink-muted">
              An address in one of an airport&apos;s postcodes counts as that airport: the journey
              pays the airport fee, and a pick-up there asks for a flight number and offers Meet
              &amp; Greet.
            </p>
          </div>
          <Link href="/airports/new" className="btn btn-primary max-sm:w-full">
            Add airport
          </Link>
        </div>

        {isPending ? (
          <div role="status" className="flex items-center gap-3 border-t border-line pt-6">
            <Spinner />
            <p className="text-base text-ink-muted">Loading the airports</p>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-4 border-t border-line pt-6">
            <p className="text-base leading-relaxed">
              {error.status === 403
                ? 'Your account is no longer allowed to manage airports.'
                : error.isNetworkError
                  ? 'We could not reach the server. Try again in a moment.'
                  : 'We could not load the airports. Try again in a moment.'}
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
        ) : airports.length === 0 ? (
          <p className="border-t border-line pt-6 text-base leading-relaxed text-ink-muted">
            There are no airports yet. Add the first one.
          </p>
        ) : (
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Every airport, in list order</caption>
            <thead>
              <tr className="border-y border-line text-sm text-ink-muted">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Airport
                </th>
                <th scope="col" className="px-4 py-3 font-medium max-md:hidden">
                  Postcodes
                </th>
                <th scope="col" className="px-4 py-3 font-medium max-sm:hidden">
                  Status
                </th>
                <th scope="col" className="py-3 pl-4 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-b border-line">
              {airports.map((airport) => (
                <Row key={airport.id} airport={airport} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function Status({ airport }: { airport: AdminAirport }) {
  return airport.isActive ? <Badge variant="success">On offer</Badge> : <Badge>Switched off</Badge>;
}

/** "TW6 1EW, and TW6": the main postcode, then the others that count. */
function postcodeList(airport: AdminAirport) {
  return [airport.postcode, ...airport.postcodes.filter((entry) => entry !== airport.postcode)];
}

function Row({ airport }: { airport: AdminAirport }) {
  const postcodes = postcodeList(airport);
  return (
    <tr className="align-top">
      <th scope="row" className="py-4 pr-4 font-normal">
        <div className="space-y-1">
          <p className={`font-semibold break-words ${airport.isActive ? '' : 'text-ink-muted'}`}>
            {airport.name}
          </p>
          <p className="font-mono text-sm text-ink-muted">{airport.code}</p>
          {/* On narrow screens the postcodes and status fold in here. */}
          <p className="text-sm text-ink-muted md:hidden">{postcodes.join(', ')}</p>
          <div className="pt-1 sm:hidden">
            <Status airport={airport} />
          </div>
        </div>
      </th>
      <td className="px-4 py-4 max-md:hidden">
        <p>{airport.postcode}</p>
        {postcodes.length > 1 ? (
          <p className="text-sm text-ink-muted">Also {postcodes.slice(1).join(', ')}</p>
        ) : null}
      </td>
      <td className="px-4 py-4 max-sm:hidden">
        <Status airport={airport} />
      </td>
      <td className="py-3 pl-4 text-right">
        <Link
          href={`/airports/${airport.id}/edit`}
          aria-label={`Edit ${airport.name}`}
          className="btn btn-ghost min-h-11! px-4! py-0! text-sm"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}
