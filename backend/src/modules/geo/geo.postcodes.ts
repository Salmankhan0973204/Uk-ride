import { env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';
import { TtlCache } from './geo.cache.js';

/** A UK postcode found on the map. */
export interface Place {
  /** In its printed form: "SW1A 1AA". */
  postcode: string;
  latitude: number;
  longitude: number;
  /** The council area, to show the customer which place was found: "Westminster". */
  district: string;
}

/**
 * The shape of a UK postcode: an outward part (SW1A, M1, TW6) and an inward
 * part of a digit and two letters (1AA). This only checks the shape; whether
 * the postcode really exists is asked of postcodes.io.
 */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;

/**
 * The start of a postcode someone is still typing: a whole outward part and
 * at least the digit of the inward part ("TW6 2", "SW1A 1A"). Shorter than
 * that, a postcode list would be too long to be useful.
 */
const PARTIAL_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?) ?(\d[A-Z]?)$/;

/** "sw1a1aa", " SW1A  1AA " → "SW1A 1AA", or undefined when it is not a postcode's shape. */
export function normalisePostcode(text: string): string | undefined {
  const compact = text.replace(/\s+/g, '').toUpperCase();
  if (!UK_POSTCODE.test(compact)) return undefined;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/** "tw6 2" → "TW6 2", or undefined when the text is not the start of a postcode. */
export function partialPostcode(text: string): string | undefined {
  const match = PARTIAL_POSTCODE.exec(text.trim().toUpperCase().replace(/\s+/g, ' '));
  return match ? `${match[1]} ${match[2]}` : undefined;
}

/** The outside services are slow sometimes; a customer should not wait longer than this. */
export const LOOKUP_TIMEOUT_MS = 6_000;

export const serviceDown = (what: string) =>
  new AppError(
    503,
    'SERVICE_UNAVAILABLE',
    `We could not reach the ${what} service. Try again in a moment.`,
  );

interface PostcodeResult {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  admin_district: string | null;
}

/** The answers of postcodes.io all share this shape; `result` depends on the question. */
interface PostcodesIoAnswer<T> {
  status: number;
  result?: T;
}

/** Asks postcodes.io. A failure to reach it, or an answer that is not JSON, is a 503. */
async function ask<T>(path: string, init: RequestInit = {}): Promise<PostcodesIoAnswer<T>> {
  try {
    const response = await fetch(`${env.POSTCODES_API_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    return (await response.json()) as PostcodesIoAnswer<T>;
  } catch {
    throw serviceDown('postcode');
  }
}

/** A postcodes.io result as a Place, or null when it has no map position. */
function toPlace(result: PostcodeResult): Place | null {
  if (result.latitude === null || result.longitude === null) return null;
  return {
    postcode: result.postcode,
    latitude: result.latitude,
    longitude: result.longitude,
    district: result.admin_district ?? '',
  };
}

// A postcode that does not exist is remembered too (as null), so a wrong
// guess typed again is not asked again.
const cache = new TtlCache<Place | null>();
const nearestCache = new TtlCache<Place | null>();

/**
 * Finds a UK postcode with postcodes.io: free, no key, built on Ordnance
 * Survey and ONS open data. Only the postcode is sent.
 *
 * Null when the postcode does not exist. A few real postcodes (some PO
 * boxes, new builds) have no map position yet; they come back as null too.
 */
export async function lookupPostcode(postcode: string): Promise<Place | null> {
  const cached = cache.get(postcode);
  if (cached !== undefined) return cached;

  const answer = await ask<PostcodeResult>(`/postcodes/${encodeURIComponent(postcode)}`);
  if (answer.status !== 200 && answer.status !== 404) throw serviceDown('postcode');

  const place = answer.status === 200 && answer.result ? toPlace(answer.result) : null;
  cache.set(postcode, place);
  return place;
}

/**
 * Like lookupPostcode, but a postcode that cannot be used is the customer's
 * mistake, reported on the request field `field`.
 */
export async function findPostcode(postcode: string, field: string): Promise<Place> {
  const place = await lookupPostcode(postcode);
  if (!place) {
    throw AppError.validation({ [field]: [`We could not find the postcode ${postcode}`] });
  }
  return place;
}

/**
 * Up to `limit` real postcodes that start with what was typed, with their
 * map positions: "TW6 2" → TW6 2AA, TW6 2AB... Two questions to postcodes.io:
 * the list of postcodes, then their positions in one bulk lookup.
 */
export async function postcodesStartingWith(partial: string, limit = 5): Promise<Place[]> {
  const list = await ask<string[] | null>(
    `/postcodes/${encodeURIComponent(partial)}/autocomplete?limit=${limit}`,
  );
  if (list.status !== 200) throw serviceDown('postcode');
  const postcodes = list.result ?? [];
  if (postcodes.length === 0) return [];

  const bulk = await ask<{ result: PostcodeResult | null }[]>('/postcodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes }),
  });
  if (bulk.status !== 200) throw serviceDown('postcode');

  return (bulk.result ?? []).flatMap(({ result }) => {
    const place = result ? toPlace(result) : null;
    return place ? [place] : [];
  });
}

/** How far from a map position a postcode may be and still count as its postcode. */
const NEAREST_RADIUS_METRES = 2_000;

/**
 * The postcode nearest to a map position, within 2 km, or null when there is
 * none: the place is at sea, abroad, or deep in open country.
 *
 * This is how the server learns the postcode of an address picked from the
 * search, whatever the browser says about it: the airport check (5.9) and
 * the "is it in the UK" check both rest on it.
 */
export async function nearestPostcode(latitude: number, longitude: number): Promise<Place | null> {
  // Five decimal places is about a metre: close enough to share an answer.
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = nearestCache.get(key);
  if (cached !== undefined) return cached;

  const answer = await ask<PostcodeResult[] | null>(
    `/postcodes?lon=${longitude}&lat=${latitude}&radius=${NEAREST_RADIUS_METRES}&limit=1`,
  );
  if (answer.status !== 200) throw serviceDown('postcode');

  const first = answer.result?.[0];
  const place = first ? toPlace(first) : null;
  nearestCache.set(key, place);
  return place;
}
