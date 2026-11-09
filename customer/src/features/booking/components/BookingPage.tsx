'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@ukride/shared/ui/Badge';
import { Card } from '@ukride/shared/ui/Card';
import { Checkbox } from '@ukride/shared/ui/Checkbox';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { formatPence } from '@ukride/shared/money';
import { plural } from '@ukride/shared/text';
import { formatUkClock, formatUkTime } from '@ukride/shared/time';
import type { ApiError } from '@/lib/api/client';
import { useQuote } from '../hooks/useBooking';
import { journeyFromSearch, journeyToRequest } from '../journey';
import type { QuoteLeg, QuoteOption, QuoteResult } from '../types';
import { JourneyForm } from './JourneyForm';
import type { JourneyErrors } from './JourneyForm';

/** "Pick-up: we could not find..." → "We could not find...", for the box already labelled Pick-up. */
function onField(message: string) {
  const text = message.replace(/^(Pick-up|Drop-off|Stop \d+): /, '');
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/** The API's messages, placed on the form's fields. */
function journeyErrors(error: ApiError | null): JourneyErrors | undefined {
  if (!error || error.code !== 'VALIDATION_ERROR') return;
  const details = (error.details ?? {}) as Record<string, string[] | undefined>;
  const errors: JourneyErrors = {};
  if (details.pickup?.[0]) errors.pickup = onField(details.pickup[0]);
  if (details.dropoff?.[0]) errors.dropoff = onField(details.dropoff[0]);
  for (const message of details.stops ?? []) {
    // "Stop 2: ..." belongs on the second stop; the form's first stops are keyed 0, 1, ...
    const number = /^Stop (\d+):/.exec(message)?.[1];
    if (number) errors[`stop-${Number(number) - 1}`] = onField(message);
    else errors.stops = onField(message);
  }
  if (details.pickupAt?.[0]) errors.time = onField(details.pickupAt[0]);
  if (details.returnAt?.[0]) errors.returnTime = onField(details.returnAt[0]);
  const other = details.passengers?.[0] ?? details.suitcases?.[0] ?? details.handLuggage?.[0];
  if (other) errors.form = onField(other);
  if (Object.keys(errors).length === 0) errors.form = `${error.message}.`;
  return errors;
}

/**
 * /booking: the journey from the address, its quote, and the choice of car.
 * The form sits beside the prices, filled in, so the journey can be changed
 * without going back; a change hides the prices until a new quote is asked.
 * Booking it (details, payment) arrives in Module 6.
 */
export function BookingPage() {
  const params = useSearchParams();
  const search = params.toString();
  // `params` is a new object on every render; the text of the address is the real identity.
  const journey = useMemo(() => journeyFromSearch(new URLSearchParams(search)), [search]);
  const request = useMemo(() => (journey ? journeyToRequest(journey) : undefined), [journey]);
  const quote = useQuote(search, request);
  const [changed, setChanged] = useState(false);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
      {/* On a phone the prices come first; the form to change the journey follows. */}
      <Card className="rise max-lg:order-2">
        <JourneyForm
          // A new address (the back button, a new quote) starts the form afresh.
          key={search}
          journey={journey}
          apiErrors={journeyErrors(quote.error)}
          busy={quote.isFetching}
          onSameJourney={() => void quote.refetch()}
          onChangedChange={setChanged}
          heading={journey ? 'Your journey' : 'Book your journey'}
        />
      </Card>

      <div className="max-lg:order-1">
        <Results journey={journey !== undefined} quote={quote} changed={changed} />
      </div>
    </div>
  );
}

function Results({
  journey,
  quote,
  changed,
}: {
  journey: boolean;
  quote: ReturnType<typeof useQuote>;
  changed: boolean;
}) {
  if (!journey) {
    return (
      <Card className="rise">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">Choose your car</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Fill in your journey and press Get quote to see the price of every car.
          </p>
        </div>
      </Card>
    );
  }

  if (changed) {
    return (
      <Card className="rise">
        <div role="status" className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">Choose your car</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            You changed your journey. Press Get quote to see its prices.
          </p>
        </div>
      </Card>
    );
  }

  if (quote.isPending) {
    return (
      <Card>
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-base text-ink-muted">
            Measuring the route and working out your prices
          </p>
        </div>
      </Card>
    );
  }

  if (quote.isError) {
    const onForm = quote.error.code === 'VALIDATION_ERROR';
    return (
      <Card className="rise">
        <div role="alert" className="space-y-4">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">Choose your car</h1>
          <p className="text-base leading-relaxed">
            {onForm
              ? 'Some of your journey needs changing. The form says what.'
              : quote.error.status === 429 || quote.error.status === 503
                ? quote.error.message
                : quote.error.isNetworkError
                  ? 'We could not reach the server, so there are no prices to show. Try again.'
                  : 'We could not work out the prices. Try again in a moment.'}
          </p>
          {onForm ? null : (
            <button type="button" onClick={() => quote.refetch()} className="btn btn-ghost">
              Try again
            </button>
          )}
        </div>
      </Card>
    );
  }

  // A fresh quote is a fresh choice: the key resets the chosen car and Meet & Greet.
  return (
    <Quote
      key={quote.data.quoteId ?? 'none'}
      result={quote.data}
      onRenew={() => void quote.refetch()}
    />
  );
}

/** True once the moment has passed; checked every 15 seconds. */
function useHasPassed(iso: string | null) {
  const [passed, setPassed] = useState(() => (iso ? Date.parse(iso) <= Date.now() : false));
  useEffect(() => {
    if (!iso) return;
    const check = () => setPassed(Date.parse(iso) <= Date.now());
    const timer = setInterval(check, 15_000);
    return () => clearInterval(timer);
  }, [iso]);
  return passed;
}

function Quote({ result, onRenew }: { result: QuoteResult; onRenew: () => void }) {
  const [chosenId, setChosenId] = useState(result.recommendedVehicleTypeId);
  // Meet & Greet, by leg number.
  const [meetGreet, setMeetGreet] = useState<Set<number>>(new Set());
  const expired = useHasPassed(result.expiresAt);
  const chosen = result.options.find((option) => option.vehicleType.id === chosenId);
  const isReturn = result.legs.length > 1;
  const extraPence = meetGreet.size * result.meetGreetPence;

  return (
    <Card className="rise">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">Choose your car</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            {plural(result.party.passengers, 'passenger')},{' '}
            {plural(result.party.suitcases, 'suitcase')} and{' '}
            {plural(result.party.handLuggage, 'hand bag')}.
            {result.options.length > 0 ? ' Cars are listed cheapest first.' : ''}
          </p>
        </div>

        <Legs legs={result.legs} />

        {result.options.length === 0 ? (
          <p className="border-t border-line pt-6 text-base leading-relaxed text-ink-muted">
            Prices have not been published yet. Please check back soon.
          </p>
        ) : (
          <>
            <AirportNotes
              legs={result.legs}
              meetGreetPence={result.meetGreetPence}
              chosen={meetGreet}
              onChange={setMeetGreet}
            />

            <fieldset className="space-y-2">
              <legend className="sr-only">Car</legend>
              {result.recommendedVehicleTypeId ? null : (
                <p className="rounded-2xl border border-warning/50 bg-[rgb(252_211_77/0.12)] px-4 py-3 text-sm leading-relaxed">
                  None of our cars takes {plural(result.party.passengers, 'passenger')} with this
                  much luggage. Try fewer bags, or call us to book two cars.
                </p>
              )}
              <ul className="divide-y divide-line border-y border-line">
                {result.options.map((option) => (
                  <OptionRow
                    key={option.vehicleType.id}
                    option={option}
                    party={result.party}
                    isReturn={isReturn}
                    checked={option.vehicleType.id === chosenId}
                    onChoose={() => setChosenId(option.vehicleType.id)}
                  />
                ))}
              </ul>
            </fieldset>

            {chosen ? (
              <Summary
                option={chosen}
                legs={result.legs}
                meetGreet={meetGreet}
                meetGreetPence={result.meetGreetPence}
                totalPence={chosen.pricePence + extraPence}
              />
            ) : null}

            {expired ? (
              <div
                role="alert"
                className="space-y-3 rounded-2xl border border-warning/50 bg-[rgb(252_211_77/0.12)] px-4 py-3"
              >
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">These prices have run out.</span> They were held
                  until {formatUkClock(result.expiresAt!)}. Prices can change, so ask again before
                  you book.
                </p>
                <button
                  type="button"
                  onClick={onRenew}
                  className="btn btn-ghost min-h-11! px-4! py-0! text-sm"
                >
                  Get a new quote
                </button>
              </div>
            ) : result.expiresAt ? (
              <p className="text-sm leading-relaxed text-ink-muted">
                These prices are held until {formatUkClock(result.expiresAt)} UK time. Online
                booking opens soon.
              </p>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}

const ARROW = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 shrink-0 text-ink-muted"
  >
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

/** Each leg: when, the places in order, and how far. */
function Legs({ legs }: { legs: QuoteLeg[] }) {
  return (
    <ol className="space-y-5 border-t border-line pt-6">
      {legs.map((leg) => (
        <li key={leg.direction} className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-lg font-semibold">
              {leg.direction === 'OUTBOUND' ? (legs.length > 1 ? 'Outbound' : 'Journey') : 'Return'}
            </h2>
            <span className="tabular text-ink-muted">{formatUkTime(leg.pickupAt)}</span>
            {/* It says when the pick-up is, not that every price has a night rate. */}
            {leg.night ? <Badge variant="warning">Night-time pick-up</Badge> : null}
          </div>
          <ol className="space-y-1.5">
            {leg.places.map((place, index) => (
              <li key={`${index}-${place.label}`} className="space-y-1.5">
                {index > 0 ? ARROW : null}
                <p className="flex flex-wrap items-baseline gap-x-2 leading-relaxed">
                  <span className="break-words">{place.label}</span>
                  {place.airport ? <span className="pill">{place.airport.code}</span> : null}
                </p>
              </li>
            ))}
          </ol>
          <p className="tabular text-sm text-ink-muted">
            {leg.distanceMiles.toFixed(1)} miles by road, about{' '}
            {plural(leg.durationMinutes, 'minute')}
            {leg.places.length > 2 ? `, with ${plural(leg.places.length - 2, 'stop')}` : ''}.
          </p>
        </li>
      ))}
    </ol>
  );
}

/** For each airport pick-up: the flight number to come, and Meet & Greet to choose. */
function AirportNotes({
  legs,
  meetGreetPence,
  chosen,
  onChange,
}: {
  legs: QuoteLeg[];
  meetGreetPence: number;
  chosen: Set<number>;
  onChange: (next: Set<number>) => void;
}) {
  const pickups = legs
    .map((leg, index) => ({ leg, index }))
    .filter(({ leg }) => leg.airportPickup !== null);
  if (pickups.length === 0) return null;

  return (
    <div className="space-y-3">
      {pickups.map(({ leg, index }) => (
        <div
          key={leg.direction}
          className="space-y-2 rounded-2xl border border-glass-border bg-glass px-4 py-3"
        >
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">
              {legs.length > 1 ? `${leg.direction === 'RETURN' ? 'Return' : 'Outbound'}: p` : 'P'}
              ick-up at {leg.airportPickup!.name}.
            </span>{' '}
            You will be asked for the flight number when you book, so your driver can follow the
            landing time.
          </p>
          <Checkbox
            name={`meetGreet-${index}`}
            checked={chosen.has(index)}
            onChange={(event) => {
              const next = new Set(chosen);
              if (event.target.checked) next.add(index);
              else next.delete(index);
              onChange(next);
            }}
          >
            Add Meet & Greet for {formatPence(meetGreetPence)}: your driver waits in arrivals with a
            name board.
          </Checkbox>
        </div>
      ))}
    </div>
  );
}

function OptionRow({
  option,
  party,
  isReturn,
  checked,
  onChoose,
}: {
  option: QuoteOption;
  party: QuoteResult['party'];
  isReturn: boolean;
  checked: boolean;
  onChoose: () => void;
}) {
  const type = option.vehicleType;
  return (
    <li>
      <label className={`flex gap-3 py-4 ${option.fits ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
        <input
          type="radio"
          name="vehicleType"
          value={type.id}
          checked={checked}
          disabled={!option.fits}
          onChange={onChoose}
          className="mt-1 h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-ink-muted bg-transparent transition-[border] duration-150 checked:border-[6px] checked:border-ring disabled:opacity-40"
        />
        {/* The price at the right end on wide screens, under the name on a phone. */}
        <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <span className={`min-w-0 space-y-1 ${option.fits ? '' : 'text-ink-muted'}`}>
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold break-words">{type.name}</span>
              {option.recommended ? <Badge variant="success">Recommended</Badge> : null}
            </span>
            {type.exampleModels ? (
              <span className="block text-sm text-ink-muted">
                Cars like {type.exampleModels} or similar
              </span>
            ) : null}
            <span className="block text-sm text-ink-muted">
              Up to {plural(type.passengers, 'passenger')}, {plural(type.suitcases, 'suitcase')} and{' '}
              {plural(type.handLuggage, 'hand bag')}
            </span>
            {option.fits ? null : (
              <span className="block text-sm font-medium">
                Too small for {plural(party.passengers, 'passenger')} with this luggage.
              </span>
            )}
          </span>
          <span className="tabular shrink-0 sm:text-right">
            {option.discountPence > 0 ? (
              <span className="block text-sm text-ink-muted">
                <span className="sr-only">Was </span>
                <s>{formatPence(option.originalPence)}</s>{' '}
                <span>{option.discountPercent}% off</span>
              </span>
            ) : null}
            <span
              className={`block text-2xl font-semibold tracking-tight ${option.fits ? '' : 'text-ink-muted'}`}
            >
              {formatPence(option.pricePence)}
            </span>
            {isReturn ? <span className="block text-xs text-ink-muted">both journeys</span> : null}
          </span>
        </span>
      </label>
    </li>
  );
}

/** The chosen car's total, and how it is worked out, leg by leg. */
function Summary({
  option,
  legs,
  meetGreet,
  meetGreetPence,
  totalPence,
}: {
  option: QuoteOption;
  legs: QuoteLeg[];
  meetGreet: Set<number>;
  meetGreetPence: number;
  totalPence: number;
}) {
  return (
    <section aria-label="Total" className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">
          Total, {option.vehicleType.name}
          {legs.length > 1 ? ', both journeys' : ''}
        </h2>
        {/* Announced when the choice of car or Meet & Greet changes it. */}
        <p role="status" className="tabular text-2xl font-semibold tracking-tight">
          {formatPence(totalPence)}
        </p>
      </div>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium underline decoration-ring/70 decoration-2 underline-offset-4 hover:decoration-ring">
          How this price is worked out
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>
        <div className="mt-2 space-y-4">
          {option.legs.map((leg, index) => (
            <dl key={legs[index]!.direction} className="tabular space-y-2 text-sm">
              {legs.length > 1 ? (
                <p className="font-medium">{index === 0 ? 'Outbound' : 'Return'}</p>
              ) : null}
              {leg.lines.map((line) => (
                <div key={line.code} className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">{line.label}</dt>
                  <dd>
                    {line.amountPence < 0
                      ? `−${formatPence(-line.amountPence)}`
                      : formatPence(line.amountPence)}
                  </dd>
                </div>
              ))}
              {meetGreet.has(index) ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">Meet &amp; Greet in arrivals</dt>
                  <dd>{formatPence(meetGreetPence)}</dd>
                </div>
              ) : null}
            </dl>
          ))}
          <div className="tabular flex items-baseline justify-between gap-4 border-t border-line pt-2 text-sm font-semibold">
            <span>Total</span>
            <span>{formatPence(totalPence)}</span>
          </div>
        </div>
      </details>
    </section>
  );
}
