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

/** "sw1a1aa", " SW1A  1AA " → "SW1A 1AA", or undefined when it is not a postcode's shape. */
export function normalisePostcode(text: string): string | undefined {
  const compact = text.replace(/\s+/g, '').toUpperCase();
  if (!UK_POSTCODE.test(compact)) return undefined;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/** The outside services are slow sometimes; a customer should not wait longer than this. */
export const LOOKUP_TIMEOUT_MS = 6_000;

export const serviceDown = (what: string) =>
  new AppError(
    503,
    'SERVICE_UNAVAILABLE',
    `We could not reach the ${what} service. Try again in a moment.`,
  );

const cache = new TtlCache<Place>();

interface PostcodesIoAnswer {
  status: number;
  result?: {
    postcode: string;
    latitude: number | null;
    longitude: number | null;
    admin_district: string | null;
  };
}

/**
 * Finds a UK postcode with postcodes.io: free, no key, built on Ordnance
 * Survey and ONS open data. Only the postcode is sent.
 *
 * `field` names the request field, so an unknown postcode is reported on it.
 */
export async function findPostcode(postcode: string, field: string): Promise<Place> {
  const cached = cache.get(postcode);
  if (cached) return cached;

  let answer: PostcodesIoAnswer;
  try {
    const response = await fetch(
      `${env.POSTCODES_API_URL}/postcodes/${encodeURIComponent(postcode)}`,
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    answer = (await response.json()) as PostcodesIoAnswer;
  } catch {
    // No connection, a timeout, or an answer that was not JSON.
    throw serviceDown('postcode');
  }

  if (answer.status === 404) {
    throw AppError.validation({ [field]: [`We could not find the postcode ${postcode}`] });
  }
  const result = answer.result;
  // A few real postcodes (some PO boxes, new builds) have no map position yet.
  if (answer.status !== 200 || !result || result.latitude === null || result.longitude === null) {
    if (answer.status === 200) {
      throw AppError.validation({
        [field]: [`The postcode ${postcode} has no map position. Try a nearby postcode`],
      });
    }
    throw serviceDown('postcode');
  }

  const place: Place = {
    postcode: result.postcode,
    latitude: result.latitude,
    longitude: result.longitude,
    district: result.admin_district ?? '',
  };
  cache.set(postcode, place);
  return place;
}
