'use client';

import { useId, useRef, useState } from 'react';
import { Badge } from '@ukride/shared/ui/Badge';
import { Card } from '@ukride/shared/ui/Card';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { plural } from '@ukride/shared/text';
import type { ApiError } from '@/lib/api/client';
import { formatPence } from '@ukride/shared/money';
import { formatUkTime, ukLocalToDate } from '@ukride/shared/time';
import { useQuote } from '../hooks/useQuote';
import type { QuoteRequest, QuoteResult } from '../types';

interface Values {
  from: string;
  to: string;
  /** "2026-11-02T23:30" from the date-and-time box, or empty for now. */
  pickup: string;
  airport: boolean;
}
type FieldName = 'from' | 'to' | 'pickup';
type Errors = Partial<Record<FieldName, string>>;

const FIELD_ORDER: FieldName[] = ['from', 'to', 'pickup'];

/** The shape of a UK postcode, spaces ignored. The API checks that it exists. */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;
const compact = (text: string) => text.replace(/\s+/g, '').toUpperCase();

/** "sw1a1aa" becomes "SW1A 1AA" once it has a postcode's shape; anything else stays as typed. */
function tidy(text: string) {
  const code = compact(text);
  return UK_POSTCODE.test(code) ? `${code.slice(0, -3)} ${code.slice(-3)}` : text;
}

function checkPostcode(text: string, which: string) {
  if (!text.trim()) return `Enter the ${which} postcode.`;
  if (!UK_POSTCODE.test(compact(text))) return 'Enter a UK postcode, like SW1A 1AA.';
}

function check(values: Values): Errors {
  const errors: Errors = {
    from: checkPostcode(values.from, 'pick-up'),
    to: checkPostcode(values.to, 'drop-off'),
  };
  if (!errors.from && !errors.to && compact(values.from) === compact(values.to)) {
    errors.to = 'The drop-off postcode is the same as the pick-up.';
  }
  if (values.pickup) {
    const when = ukLocalToDate(values.pickup);
    if (!when) errors.pickup = 'Enter a date and time.';
    else if (when.getTime() < Date.now() - 60_000) errors.pickup = 'Choose a time from now on.';
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

/** Messages from the API, placed on the field they belong to. */
function apiErrors(error: ApiError): Errors | undefined {
  if (error.code !== 'VALIDATION_ERROR') return;
  const details = (error.details ?? {}) as Record<string, string[]>;
  const errors: Errors = {};
  if (details.pickupPostcode?.[0]) errors.from = `${details.pickupPostcode[0]}.`;
  if (details.dropoffPostcode?.[0]) errors.to = `${details.dropoffPostcode[0]}.`;
  if (details.pickupAt?.[0]) errors.pickup = `${details.pickupAt[0]}.`;
  return Object.keys(errors).length > 0 ? errors : undefined;
}

export function QuoteForm() {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>({ from: '', to: '', pickup: '', airport: false });
  const [errors, setErrors] = useState<Errors>({});
  const [request, setRequest] = useState<QuoteRequest>();
  const quote = useQuote(request);
  const shownErrors = { ...(quote.error ? apiErrors(quote.error) : undefined), ...errors };

  const id = (name: string) => `${formId}-${name}`;
  const pickupHint = 'UK time. Leave it empty for now.';

  function setValue(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = check(values);
    setErrors(found);
    const first = FIELD_ORDER.find((name) => found[name]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const next: QuoteRequest = {
      pickupPostcode: values.from.trim(),
      dropoffPostcode: values.to.trim(),
      airport: values.airport,
      ...(values.pickup ? { pickupAt: ukLocalToDate(values.pickup)!.toISOString() } : {}),
    };
    // The same question again would be answered from the cache. Prices may
    // have changed since, so pressing the button always asks the server.
    if (JSON.stringify(next) === JSON.stringify(request)) void quote.refetch();
    else setRequest(next);
  }

  // The examples are hints under the box, not placeholders inside it: an
  // example inside an empty box looks like an answer already given.
  const postcode = (name: 'from' | 'to', label: string, hint: string, autoComplete: string) => (
    <Field id={id(name)} label={label} hint={hint} error={shownErrors[name]}>
      <input
        id={id(name)}
        name={name}
        type="text"
        autoComplete={autoComplete}
        autoCapitalize="characters"
        spellCheck={false}
        value={values[name]}
        onChange={(event) => setValue(name, event.target.value)}
        onBlur={() => setValues((current) => ({ ...current, [name]: tidy(current[name]) }))}
        {...describedBy(id(name), { hint, error: shownErrors[name] })}
        className="control uppercase"
      />
    </Field>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="rise">
        <div className="space-y-7">
          <div className="space-y-2">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              Get a price
            </h1>
            <p className="max-w-[56ch] text-base leading-relaxed text-ink-muted">
              Enter where you are going from and to. We measure the route by road and give you the
              exact fare in each of our vehicles.
            </p>
          </div>

          <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              {postcode('from', 'Pick-up postcode', 'Like SW1A 1AA.', 'shipping postal-code')}
              {postcode('to', 'Drop-off postcode', 'Like TW6 1EW for Heathrow.', 'off')}
            </div>

            {/* Half width, label and all, so "Optional" sits by its own box. */}
            <div className="grid sm:grid-cols-2 sm:gap-4">
              <Field
                id={id('pickup')}
                label="Pick-up time"
                optional
                hint={pickupHint}
                error={shownErrors.pickup}
              >
                <input
                  id={id('pickup')}
                  name="pickup"
                  type="datetime-local"
                  value={values.pickup}
                  onChange={(event) => setValue('pickup', event.target.value)}
                  {...describedBy(id('pickup'), { hint: pickupHint, error: shownErrors.pickup })}
                  className="control tabular"
                />
              </Field>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="airport"
                checked={values.airport}
                onChange={(event) =>
                  setValues((current) => ({ ...current, airport: event.target.checked }))
                }
                className="h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-ink-muted bg-transparent bg-center bg-no-repeat transition-colors duration-150 checked:border-ring checked:bg-ring checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%231b164a%22%20stroke-width=%223.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><path%20d=%22M5%2012.5l4.5%204.5L19%207.5%22/></svg>')]"
              />
              <span>The journey starts or ends at an airport</span>
            </label>

            <button
              type="submit"
              disabled={quote.isFetching}
              className="btn btn-primary max-sm:w-full"
            >
              {quote.isFetching ? (
                <>
                  <Spinner />
                  Measuring the route
                </>
              ) : (
                'Get prices'
              )}
            </button>
          </form>
        </div>
      </Card>

      <Results quote={quote} />
    </div>
  );
}

function Results({ quote }: { quote: ReturnType<typeof useQuote> }) {
  // Nothing asked yet.
  if (quote.fetchStatus === 'idle' && quote.status === 'pending') return null;

  if (quote.isPending) {
    return (
      <Card>
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-base text-ink-muted">Measuring the route and working out the prices</p>
        </div>
      </Card>
    );
  }

  if (quote.isError) {
    // Field problems are shown on the fields themselves.
    if (apiErrors(quote.error)) return null;
    return (
      <Card>
        <div role="alert" className="space-y-4">
          <p className="text-base leading-relaxed">
            {/* 429: too many quotes. 503: a map service is down. Both say what to do. */}
            {quote.error.status === 429 || quote.error.status === 503
              ? quote.error.message
              : quote.error.isNetworkError
                ? 'We could not reach the server, so there are no prices to show. Try again.'
                : 'We could not work out the prices. Try again in a moment.'}
          </p>
          <button type="button" onClick={() => quote.refetch()} className="btn btn-ghost">
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return <Prices result={quote.data} updating={quote.isPlaceholderData} />;
}

function Prices({ result, updating }: { result: QuoteResult; updating: boolean }) {
  const route = result.route;
  const place = (point: { postcode: string; district: string }) =>
    point.district ? `${point.postcode} (${point.district})` : point.postcode;
  const summary = [
    route
      ? `${place(route.pickup)} to ${place(route.dropoff)}: ${route.distanceMiles.toFixed(1)} miles by road, about ${route.durationMinutes} minutes.`
      : `${plural(result.chargedMiles, 'mile')}.`,
    `Picked up ${formatUkTime(result.pickupAt)} UK time${result.airport ? ', to or from an airport' : ''}.`,
  ].join(' ');

  return (
    <Card className={`rise transition-opacity duration-200 ${updating ? 'opacity-60' : ''}`}>
      <section aria-labelledby="prices-heading" aria-busy={updating} className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="prices-heading" className="text-2xl font-semibold tracking-tight">
              Your prices
            </h2>
            {/* It says when the pick-up is, not that every price has a night rate. */}
            {result.night ? <Badge variant="warning">Night-time pick-up</Badge> : null}
          </div>
          {/* Announced when the prices change. */}
          <p role="status" className="text-base leading-relaxed text-ink-muted">
            {result.quotes.length > 0 ? summary : ''}
          </p>
        </div>

        {result.quotes.length === 0 ? (
          <p className="border-t border-line pt-6 text-base leading-relaxed text-ink-muted">
            Prices have not been published yet. Please check back soon.
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {result.quotes.map(({ vehicleType, lines, totalPence }) => (
              <li key={vehicleType.id} className="space-y-3 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-lg font-semibold break-words">{vehicleType.name}</h3>
                    <p className="text-sm text-ink-muted">
                      Up to {plural(vehicleType.passengers, 'passenger')} and{' '}
                      {plural(vehicleType.suitcases, 'suitcase')}
                    </p>
                  </div>
                  <p className="tabular text-2xl font-semibold tracking-tight">
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
                  <dl className="tabular mt-2 space-y-2 text-sm">
                    {lines.map((line) => (
                      <div key={line.code} className="flex items-baseline justify-between gap-4">
                        <dt className="text-ink-muted">{line.label}</dt>
                        <dd>{formatPence(line.amountPence)}</dd>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2 font-semibold">
                      <dt>Total</dt>
                      <dd>{formatPence(totalPence)}</dd>
                    </div>
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm leading-relaxed text-ink-muted">
          A price is not a booking. Booking opens soon; the price will be worked out again when you
          book.
        </p>
      </section>
    </Card>
  );
}
