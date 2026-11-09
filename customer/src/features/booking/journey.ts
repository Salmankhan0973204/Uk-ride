import { ukLocalToDate } from '@ukride/shared/time';
import type { Journey, JourneyPlace, QuoteRequest } from './types';

/** Where the widget sends the journey. */
export const BOOKING_PATH = '/booking';

/**
 * The journey lives in the address of /booking, so a reload, the back button
 * and a shared link all keep it. ukride.uk keeps it in sessionStorage, which
 * a new tab does not have.
 *
 *   /booking?from=51.501009,-0.141588,SW1A 1AA&via=...&to=...&date=2026-11-20&time=12:30
 *            &rdate=2026-11-27&rtime=18:00&pax=2&cases=2&hand=1
 *
 * A place is its map position, then its words. The words may hold commas, so
 * only the first two commas split.
 */
function encodePlace(place: JourneyPlace) {
  return `${place.latitude.toFixed(6)},${place.longitude.toFixed(6)},${place.label}`;
}

function decodePlace(text: string | null): JourneyPlace | undefined {
  if (!text) return undefined;
  const match = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(.+)$/.exec(text);
  if (!match) return undefined;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  const label = match[3]!.trim();
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !label) return undefined;
  return { label: label.slice(0, 200), latitude, longitude };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/** A whole number in a range, or the fallback when it is missing or wrong. */
function count(text: string | null, min: number, max: number, fallback: number) {
  if (text === null || !/^\d+$/.test(text)) return fallback;
  return Math.min(max, Math.max(min, Number(text)));
}

export function journeyToSearch(journey: Journey) {
  const params = new URLSearchParams();
  params.set('from', encodePlace(journey.pickup));
  for (const stop of journey.stops) params.append('via', encodePlace(stop));
  params.set('to', encodePlace(journey.dropoff));
  params.set('date', journey.date);
  params.set('time', journey.time);
  if (journey.returnDate && journey.returnTime) {
    params.set('rdate', journey.returnDate);
    params.set('rtime', journey.returnTime);
  }
  params.set('pax', String(journey.passengers));
  params.set('cases', String(journey.suitcases));
  params.set('hand', String(journey.handLuggage));
  return params.toString();
}

/**
 * The journey in an address, or undefined when something it needs is missing
 * or unreadable: then the page shows the empty form. A link someone typed by
 * hand must never crash the page.
 */
export function journeyFromSearch(params: URLSearchParams): Journey | undefined {
  const pickup = decodePlace(params.get('from'));
  const dropoff = decodePlace(params.get('to'));
  const date = params.get('date') ?? '';
  const time = params.get('time') ?? '';
  if (!pickup || !dropoff || !DATE.test(date) || !TIME.test(time)) return undefined;

  const stops = params
    .getAll('via')
    .map(decodePlace)
    .filter((stop): stop is JourneyPlace => stop !== undefined)
    .slice(0, 5);
  const returnDate = params.get('rdate') ?? '';
  const returnTime = params.get('rtime') ?? '';
  const isReturn = DATE.test(returnDate) && TIME.test(returnTime);

  return {
    pickup,
    stops,
    dropoff,
    date,
    time,
    ...(isReturn ? { returnDate, returnTime } : {}),
    passengers: count(params.get('pax'), 1, 8, 1),
    suitcases: count(params.get('cases'), 0, 8, 0),
    handLuggage: count(params.get('hand'), 0, 8, 0),
  };
}

/** The API's body for a journey. The times are UK time on the boxes, made exact here. */
export function journeyToRequest(journey: Journey): QuoteRequest | undefined {
  const pickupAt = ukLocalToDate(`${journey.date}T${journey.time}`);
  if (!pickupAt) return undefined;
  const returnAt =
    journey.returnDate && journey.returnTime
      ? ukLocalToDate(`${journey.returnDate}T${journey.returnTime}`)
      : undefined;

  return {
    pickup: journey.pickup,
    stops: journey.stops,
    dropoff: journey.dropoff,
    pickupAt: pickupAt.toISOString(),
    ...(returnAt ? { returnAt: returnAt.toISOString() } : {}),
    passengers: journey.passengers,
    suitcases: journey.suitcases,
    handLuggage: journey.handLuggage,
  };
}
