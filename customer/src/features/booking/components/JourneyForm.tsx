'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { formatUkTime, ukDate, ukLocalToDate } from '@ukride/shared/time';
import { useBookingConfig } from '../hooks/useBooking';
import { BOOKING_PATH, journeyToSearch } from '../journey';
import type { Journey, JourneyPlace } from '../types';
import { AddressSearch, emptyAddress } from './AddressSearch';
import type { AddressValue } from './AddressSearch';
import { Stepper } from './Stepper';

/** Used until GET /config has answered. The server checks with the real values anyway. */
const FALLBACK = { bookingLeadMinutes: 240, maxStops: 5, maxPassengers: 8, maxBags: 8 };

interface Stop extends AddressValue {
  /** A stable key, so removing stop 2 does not move the text of stop 3 into its box. */
  key: number;
}

interface Values {
  pickup: AddressValue;
  stops: Stop[];
  dropoff: AddressValue;
  date: string;
  time: string;
  returnTrip: boolean;
  returnDate: string;
  returnTime: string;
  passengers: number;
  suitcases: number;
  handLuggage: number;
}

/** Field names for messages. A stop's is "stop-<key>". */
export type JourneyErrors = Partial<Record<string, string>>;

const FIXED_ORDER = ['pickup', 'stops', 'dropoff', 'date', 'time', 'returnDate', 'returnTime'];

const fromPlace = (place: JourneyPlace): AddressValue => ({
  text: place.label,
  place: { ...place, airport: null },
});

function initialValues(journey?: Journey): Values {
  return {
    pickup: journey ? fromPlace(journey.pickup) : emptyAddress(),
    stops: (journey?.stops ?? []).map((stop, index) => ({ ...fromPlace(stop), key: index })),
    dropoff: journey ? fromPlace(journey.dropoff) : emptyAddress(),
    date: journey?.date ?? '',
    time: journey?.time ?? '',
    returnTrip: Boolean(journey?.returnDate),
    returnDate: journey?.returnDate ?? '',
    returnTime: journey?.returnTime ?? '',
    passengers: journey?.passengers ?? 1,
    suitcases: journey?.suitcases ?? 0,
    handLuggage: journey?.handLuggage ?? 0,
  };
}

const plain = (place: NonNullable<AddressValue['place']>): JourneyPlace => ({
  label: place.label,
  latitude: place.latitude,
  longitude: place.longitude,
});

/** The journey the form holds, or undefined while an address is not picked from the list. */
function toJourney(values: Values): Journey | undefined {
  const { pickup, dropoff } = values;
  if (!pickup.place || !dropoff.place || values.stops.some((stop) => !stop.place)) return;
  return {
    pickup: plain(pickup.place),
    stops: values.stops.map((stop) => plain(stop.place!)),
    dropoff: plain(dropoff.place),
    date: values.date,
    time: values.time,
    ...(values.returnTrip ? { returnDate: values.returnDate, returnTime: values.returnTime } : {}),
    passengers: values.passengers,
    suitcases: values.suitcases,
    handLuggage: values.handLuggage,
  };
}

/** Straight-line metres between two places, as the API measures "the same place". */
function metresApart(a: JourneyPlace, b: JourneyPlace) {
  const north = (a.latitude - b.latitude) * 111_320;
  const east =
    (a.longitude - b.longitude) *
    111_320 *
    Math.cos((((a.latitude + b.latitude) / 2) * Math.PI) / 180);
  return Math.hypot(north, east);
}

function hoursInWords(minutes: number) {
  if (minutes % 60 !== 0) return `${minutes} minutes`;
  return minutes === 60 ? '1 hour' : `${minutes / 60} hours`;
}

/** The same rules as the API, so most mistakes are caught before anything is sent. */
function check(values: Values, leadMinutes: number): JourneyErrors {
  const errors: JourneyErrors = {};
  const address = (value: AddressValue, which: string) => {
    if (value.place) return;
    return value.text.trim()
      ? `Choose the ${which} from the list of suggestions.`
      : `Enter the ${which} address.`;
  };
  errors.pickup = address(values.pickup, 'pick-up');
  errors.dropoff = address(values.dropoff, 'drop-off');
  for (const stop of values.stops) {
    if (!stop.place) {
      errors[`stop-${stop.key}`] = stop.text.trim()
        ? 'Choose this stop from the list, or remove it.'
        : 'Enter the stop address, or remove it.';
    }
  }
  if (
    !errors.dropoff &&
    values.pickup.place &&
    values.dropoff.place &&
    metresApart(values.pickup.place, values.dropoff.place) < 100
  ) {
    errors.dropoff = 'The drop-off is the same place as the pick-up.';
  }

  if (!values.date) errors.date = 'Choose the date.';
  if (!values.time) errors.time = 'Choose the time.';
  const pickupAt =
    values.date && values.time ? ukLocalToDate(`${values.date}T${values.time}`) : undefined;
  const earliest = Date.now() + leadMinutes * 60_000;
  if (pickupAt && pickupAt.getTime() < earliest) {
    errors.time = `Book at least ${hoursInWords(leadMinutes)} ahead. The earliest pick-up is ${formatUkTime(new Date(earliest + 5 * 60_000).toISOString())}.`;
  }

  if (values.returnTrip) {
    if (!values.returnDate) errors.returnDate = 'Choose the return date.';
    if (!values.returnTime) errors.returnTime = 'Choose the return time.';
    const returnAt =
      values.returnDate && values.returnTime
        ? ukLocalToDate(`${values.returnDate}T${values.returnTime}`)
        : undefined;
    if (pickupAt && returnAt && returnAt.getTime() <= pickupAt.getTime()) {
      errors.returnTime = 'The return must be after the pick-up.';
    }
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

interface JourneyFormProps {
  /** The journey to start from: the one in the address of /booking. */
  journey?: Journey;
  /** Messages from the API about this journey, placed on its fields. */
  apiErrors?: JourneyErrors;
  /** The quote for `journey` is loading. */
  busy?: boolean;
  /** Pressed with the same journey again: ask for a fresh quote. */
  onSameJourney?: () => void;
  /** Whether what is on the form still matches `journey`. */
  onChangedChange?: (changed: boolean) => void;
  headingLevel?: 'h1' | 'h2';
  heading: string;
}

/**
 * "BOOK YOUR JOURNEY": where from and to, any stops, when, a return, and who
 * is coming with how much luggage. "Get quote" opens /booking with all of it
 * in the address; on /booking the same form is filled in from there.
 */
export function JourneyForm({
  journey,
  apiErrors,
  busy = false,
  onSameJourney,
  onChangedChange,
  headingLevel = 'h2',
  heading,
}: JourneyFormProps) {
  const formId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const nextKey = useRef((journey?.stops.length ?? 0) + 1);
  const config = useBookingConfig().data;
  const leadMinutes = config?.bookingLeadMinutes ?? FALLBACK.bookingLeadMinutes;
  const maxStops = config?.limits.maxStops ?? FALLBACK.maxStops;

  const [values, setValues] = useState<Values>(() => initialValues(journey));
  const [errors, setErrors] = useState<JourneyErrors>({});
  // The API's messages hold until the person changes the field they are about.
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const shown: JourneyErrors = { ...errors };
  for (const [name, message] of Object.entries(apiErrors ?? {})) {
    if (!shown[name] && !dismissed.has(name)) shown[name] = message;
  }

  // Any change to the journey takes the prices away until a new quote is asked for.
  const current = toJourney(values);
  const changed = journey
    ? !current || journeyToSearch(current) !== journeyToSearch(journey)
    : false;
  useEffect(() => onChangedChange?.(changed), [changed, onChangedChange]);

  const id = (name: string) => `${formId}-${name}`;
  const Heading = headingLevel;

  function touch(name: string) {
    if (errors[name]) setErrors((now) => ({ ...now, [name]: undefined }));
    if (apiErrors?.[name]) setDismissed((now) => new Set(now).add(name));
  }

  function set<K extends keyof Values>(key: K, value: Values[K], field: string = key) {
    setValues((now) => ({ ...now, [key]: value }));
    touch(field);
  }

  function setStop(key: number, value: AddressValue) {
    setValues((now) => ({
      ...now,
      stops: now.stops.map((stop) => (stop.key === key ? { ...value, key } : stop)),
    }));
    touch(`stop-${key}`);
    touch('stops');
  }

  function addStop() {
    const key = nextKey.current++;
    setValues((now) => ({ ...now, stops: [...now.stops, { ...emptyAddress(), key }] }));
    // The new box gets focus, so the next thing typed goes into it.
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>(`[name="stop-${key}"]`)?.focus(),
    );
  }

  function removeStop(key: number) {
    setValues((now) => ({ ...now, stops: now.stops.filter((stop) => stop.key !== key) }));
    touch(`stop-${key}`);
    touch('stops');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = check(values, leadMinutes);
    setErrors(found);
    const order = [
      'pickup',
      ...values.stops.map((stop) => `stop-${stop.key}`),
      ...FIXED_ORDER.slice(2),
    ];
    const first = order.find((name) => found[name]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const next = toJourney(values)!;
    if (journey && journeyToSearch(next) === journeyToSearch(journey)) {
      setDismissed(new Set());
      onSameJourney?.();
      return;
    }
    router.push(`${BOOKING_PATH}?${journeyToSearch(next)}`);
  }

  const addressField = (name: 'pickup' | 'dropoff', label: string) => {
    const value = values[name];
    const hint = value.place?.airport ? `${value.place.airport.name}.` : undefined;
    return (
      <Field id={id(name)} label={label} hint={hint} error={shown[name]}>
        <AddressSearch
          id={id(name)}
          name={name}
          value={value}
          onChange={(next) => set(name, next)}
          {...describedBy(id(name), { hint, error: shown[name] })}
        />
      </Field>
    );
  };

  const when = (dateName: 'date' | 'returnDate', timeName: 'time' | 'returnTime', what: string) => (
    <div className="grid gap-5 min-[420px]:grid-cols-2 min-[420px]:gap-4">
      <Field id={id(dateName)} label={`${what} date`} error={shown[dateName]}>
        <input
          id={id(dateName)}
          name={dateName}
          type="date"
          min={ukDate()}
          value={values[dateName]}
          onChange={(event) => set(dateName, event.target.value)}
          {...describedBy(id(dateName), { error: shown[dateName] })}
          className="control tabular"
        />
      </Field>
      <Field id={id(timeName)} label={`${what} time`} hint="UK time." error={shown[timeName]}>
        <input
          id={id(timeName)}
          name={timeName}
          type="time"
          step={300}
          value={values[timeName]}
          onChange={(event) => set(timeName, event.target.value)}
          {...describedBy(id(timeName), { hint: 'UK time.', error: shown[timeName] })}
          className="control tabular"
        />
      </Field>
    </div>
  );

  return (
    <div className="space-y-6">
      <Heading className="text-2xl font-semibold tracking-tight">{heading}</Heading>

      <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-5">
        {addressField('pickup', 'Pick-up')}

        {values.stops.map((stop, index) => {
          const name = `stop-${stop.key}`;
          const error = shown[name] ?? (index === 0 ? shown.stops : undefined);
          return (
            <div key={stop.key} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Field id={id(name)} label={`Stop ${index + 1}`} error={error}>
                  <AddressSearch
                    id={id(name)}
                    name={name}
                    value={stop}
                    onChange={(next) => setStop(stop.key, next)}
                    {...describedBy(id(name), { error })}
                  />
                </Field>
              </div>
              {/* Lined up with the box, below the label. */}
              <button
                type="button"
                onClick={() => removeStop(stop.key)}
                aria-label={`Remove stop ${index + 1}`}
                className="btn btn-ghost mt-7 min-h-12! w-12 shrink-0 px-0!"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="h-5 w-5"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          );
        })}

        {values.stops.length < maxStops ? (
          <button
            type="button"
            onClick={addStop}
            className="btn btn-ghost min-h-11! px-4! py-0! text-sm"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="h-4 w-4"
            >
              <path d="M12 6v12M6 12h12" />
            </svg>
            Add a stop
          </button>
        ) : (
          <p className="text-sm text-ink-muted">That is the most stops one journey can have.</p>
        )}

        {addressField('dropoff', 'Drop-off')}

        {when('date', 'time', 'Pick-up')}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Add a return journey</legend>
          <div className="flex gap-6">
            {[
              { value: false, label: 'No' },
              { value: true, label: 'Yes' },
            ].map((option) => (
              <label key={option.label} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="returnTrip"
                  checked={values.returnTrip === option.value}
                  onChange={() => set('returnTrip', option.value, 'returnTime')}
                  className="h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-ink-muted bg-transparent transition-[border] duration-150 checked:border-[6px] checked:border-ring"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {values.returnTrip ? when('returnDate', 'returnTime', 'Return') : null}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-5">
          <Stepper
            label="Passengers"
            word="passenger"
            value={values.passengers}
            min={1}
            max={config?.limits.maxPassengers ?? FALLBACK.maxPassengers}
            onChange={(next) => set('passengers', next)}
          />
          <Stepper
            label="Suitcases"
            word="suitcase"
            value={values.suitcases}
            min={0}
            max={config?.limits.maxSuitcases ?? FALLBACK.maxBags}
            onChange={(next) => set('suitcases', next)}
          />
          <Stepper
            label="Hand bags"
            word="hand bag"
            value={values.handLuggage}
            min={0}
            max={config?.limits.maxHandLuggage ?? FALLBACK.maxBags}
            onChange={(next) => set('handLuggage', next)}
          />
        </div>

        {shown.form ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {shown.form}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? (
            <>
              <Spinner />
              Working out your prices
            </>
          ) : (
            'Get quote'
          )}
        </button>
      </form>
    </div>
  );
}
