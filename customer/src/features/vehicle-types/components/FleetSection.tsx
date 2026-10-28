'use client';

import { Card } from '@ukride/shared/ui/Card';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { useId } from 'react';
import { useVehicleTypes } from '../hooks/useVehicleTypes';
import { FLEET_ANCHOR } from '../paths';
import type { VehicleType } from '../types';

/**
 * The fleet on the home page, as on ukride.uk: one glass card per class, with
 * example models and what fits. The customer books a class, never one car.
 */
export function FleetSection() {
  const headingId = useId();
  const { data: vehicleTypes, isPending, isError, error, refetch, isFetching } = useVehicleTypes();

  return (
    // scroll-mt keeps the heading clear of the floating navigation bar.
    <section id={FLEET_ANCHOR} aria-labelledby={headingId} className="scroll-mt-28 space-y-8">
      <div className="space-y-3">
        <h2
          id={headingId}
          className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
        >
          Our fleet
        </h2>
        <p className="max-w-[52ch] text-lg leading-relaxed text-ink-muted">
          Choose by how many people are travelling and how much luggage you bring. You book the
          class: your car is one of the models shown, or similar.
        </p>
      </div>

      {isPending ? (
        <Card>
          <div role="status" className="flex items-center gap-3">
            <Spinner />
            <p className="text-base text-ink-muted">Loading the fleet</p>
          </div>
        </Card>
      ) : isError ? (
        <Card>
          <div role="alert" className="space-y-4">
            <p className="text-base leading-relaxed">
              {error.isNetworkError
                ? 'We could not reach the server, so the fleet cannot be shown.'
                : 'We could not load the fleet.'}{' '}
              Try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn btn-ghost"
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
        </Card>
      ) : vehicleTypes.length === 0 ? (
        <Card>
          <p className="text-base leading-relaxed text-ink-muted">
            No vehicles are listed yet. Check back soon.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicleTypes.map((type, index) => (
            <li key={type.id} className="flex">
              <FleetCard type={type} order={index} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Line icons on the 24 unit grid, drawn in the current text colour. */
const ICONS = {
  car: (
    <>
      <path d="M5 16V11.5L7 6.5h10l2 5V16M3.5 16h17" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  passengers: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c.9-3.6 3.6-5.5 7-5.5s6.1 1.9 7 5.5" />
    </>
  ),
  suitcases: (
    <>
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M9 7V4.5h6V7M9 11v5M15 11v5" />
    </>
  ),
  handLuggage: (
    <>
      <rect x="4.5" y="9" width="15" height="10.5" rx="2.5" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </>
  ),
};

function Icon({ name, className }: { name: keyof typeof ICONS; className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}

/** What fits, in the order a customer counts it. */
const CAPACITY = [
  { key: 'passengers', label: 'Passengers', word: 'passenger' },
  { key: 'suitcases', label: 'Suitcases', word: 'suitcase' },
  { key: 'handLuggage', label: 'Hand bags', word: 'hand bag' },
] as const;

function FleetCard({ type, order }: { type: VehicleType; order: number }) {
  return (
    <article
      className="glass rise flex w-full flex-col gap-5 p-6"
      style={{ '--order': order } as React.CSSProperties}
    >
      {type.imageUrl ? (
        // A plain img: the address is whatever an admin pasted, on any host, so
        // next/image cannot know its domain in advance. The name is right below,
        // so the picture needs no words of its own.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={type.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="aspect-[16/9] w-full rounded-2xl object-contain"
        />
      ) : null}

      <div className="flex items-start gap-4">
        {type.imageUrl ? null : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-glass-border bg-glass-strong">
            <Icon name="car" className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h3 className="text-xl font-semibold tracking-tight break-words">{type.name}</h3>
          {type.exampleModels ? (
            <p className="text-sm leading-relaxed text-ink-muted">
              Cars like {type.exampleModels} or similar
            </p>
          ) : null}
        </div>
      </div>

      <p className="leading-relaxed text-ink-muted">{type.description}</p>

      <dl className="tabular mt-auto grid grid-cols-3 border-t border-line pt-4">
        {CAPACITY.map(({ key, label, word }) => (
          <div key={key} className="flex flex-col items-center gap-1 text-center">
            <dt className="sr-only">{label}</dt>
            <dd className="flex flex-col items-center gap-1">
              <Icon name={key} className="h-5 w-5 text-ink-muted" />
              <span className="text-lg leading-none font-semibold">{type[key]}</span>
              {/* The dt already names it for screen readers: "Suitcases 3". */}
              <span aria-hidden="true" className="text-xs text-ink-muted">
                {type[key] === 1 ? word : `${word}s`}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
