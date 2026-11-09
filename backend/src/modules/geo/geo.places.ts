import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { TtlCache } from './geo.cache.js';
import {
  LOOKUP_TIMEOUT_MS,
  lookupPostcode,
  normalisePostcode,
  partialPostcode,
  postcodesStartingWith,
  serviceDown,
} from './geo.postcodes.js';
import type { Place } from './geo.postcodes.js';

/** One suggestion under the address box. */
export interface PlaceSuggestion {
  /** The first line, in bold: "10 Downing Street", "SW1A 1AA". */
  label: string;
  /** The second line: "Westminster, SW1A 2AA". Empty when there is nothing to add. */
  detail: string;
  latitude: number;
  longitude: number;
  /** Known for postcodes and most addresses; the quote looks it up again anyway. */
  postcode: string | null;
  kind: 'postcode' | 'address';
}

/** The most suggestions a search answers with. */
export const MAX_SUGGESTIONS = 8;

/**
 * Great Britain and Northern Ireland, as west, south, east, north. Photon
 * covers the world; asking only inside this box keeps foreign places out.
 */
const UK_BOUNDS = '-8.75,49.8,1.9,60.95';
/** Central London. Nearer places are listed first, as most journeys start or end here. */
const LONDON = { lat: 51.5074, lon: -0.1278 };

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    countrycode?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    postcode?: string;
  };
}

/**
 * The two lines a person reads for one Photon result. Photon gives the parts
 * of an address separately, and not every result has every part: a station
 * has a name and a street, a house has a number and a street, a town has
 * only a name.
 */
export function describeFeature({ properties: p }: PhotonFeature) {
  const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ');
  const label = p.name || streetLine || p.city || p.county || '';
  // "London Borough of Hillingdon" reads as "Hillingdon" everywhere else.
  const town = (p.city || p.district || p.locality || p.county)?.replace(
    /^(London|Royal) Borough of /,
    '',
  );
  const postcode = p.postcode ? normalisePostcode(p.postcode) : undefined;

  const detail = [streetLine, town, postcode]
    // A part already in the first line ("10 Downing Street" holds "Downing Street") is not repeated.
    .filter((part): part is string => Boolean(part) && !label.includes(part!))
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');

  return { label, detail, postcode: postcode ?? null };
}

interface Point {
  latitude: number;
  longitude: number;
}

/**
 * The straight-line distance between two points, in metres. Treating the
 * Earth as flat over a few kilometres is accurate enough for telling whether
 * two map pins are the same place.
 */
export function metresBetween(a: Point, b: Point) {
  const metresPerDegree = 111_320;
  const north = (a.latitude - b.latitude) * metresPerDegree;
  const east =
    (a.longitude - b.longitude) *
    metresPerDegree *
    Math.cos((((a.latitude + b.latitude) / 2) * Math.PI) / 180);
  return Math.hypot(north, east);
}

const photonCache = new TtlCache<PlaceSuggestion[]>(60 * 60_000);

/**
 * Addresses, streets, stations and places that match the text, from Photon:
 * a free search over OpenStreetMap, run by komoot. Only the typed text is
 * sent. PLACES_API_URL points it at another Photon server, or our own.
 */
async function searchPhoton(text: string): Promise<PlaceSuggestion[]> {
  const key = text.toLowerCase();
  const cached = photonCache.get(key);
  if (cached) return cached;

  const query = new URLSearchParams({
    q: text,
    limit: '12',
    lang: 'en',
    bbox: UK_BOUNDS,
    lat: String(LONDON.lat),
    lon: String(LONDON.lon),
    // How wide the pull towards London is. At 10, "Kings Cross" is the one
    // in London, not a hospital in Dundee, while "Manchester" still finds
    // the city, not Manchester Square in Marylebone.
    zoom: '10',
  });

  let features: PhotonFeature[];
  try {
    const response = await fetch(`${env.PLACES_API_URL}/api/?${query}`, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Photon answered ${response.status}`);
    features = ((await response.json()) as { features?: PhotonFeature[] }).features ?? [];
  } catch {
    throw serviceDown('address search');
  }

  const suggestions: PlaceSuggestion[] = [];
  for (const feature of features) {
    // The box also takes in a corner of Ireland and of France.
    if (feature.properties.countrycode !== 'GB') continue;
    const { label, detail, postcode } = describeFeature(feature);
    // A postcode on its own is postcodes.io's to answer, with its exact position.
    if (!label || normalisePostcode(label)) continue;

    const [longitude, latitude] = feature.geometry.coordinates;
    // OpenStreetMap often has one place several times: a station, its
    // entrance and its bus stop. The same name within 300 m is one place.
    const repeat = suggestions.some(
      (other) =>
        other.label.toLowerCase() === label.toLowerCase() &&
        metresBetween(other, { latitude, longitude }) < 300,
    );
    if (repeat) continue;

    suggestions.push({ label, detail, latitude, longitude, postcode, kind: 'address' });
  }

  photonCache.set(key, suggestions);
  return suggestions;
}

const fromPostcode = (place: Place): PlaceSuggestion => ({
  label: place.postcode,
  detail: place.district,
  latitude: place.latitude,
  longitude: place.longitude,
  postcode: place.postcode,
  kind: 'postcode',
});

/** Postcodes that match the text: the one postcode typed, or those that start with it. */
async function searchPostcodes(text: string): Promise<PlaceSuggestion[]> {
  const whole = normalisePostcode(text);
  if (whole) {
    const place = await lookupPostcode(whole);
    return place ? [fromPostcode(place)] : [];
  }
  const start = partialPostcode(text);
  if (start) return (await postcodesStartingWith(start)).map(fromPostcode);
  return [];
}

/**
 * Suggestions for an address box: postcodes first when the text looks like
 * one, then addresses and places.
 *
 * The two services are asked at the same time. If one of them is down, the
 * other's answers are still shown; only when both fail is it a 503.
 */
export async function searchPlaces(text: string): Promise<PlaceSuggestion[]> {
  const [postcodes, addresses] = await Promise.allSettled([
    searchPostcodes(text),
    searchPhoton(text),
  ]);

  const found = [
    ...(postcodes.status === 'fulfilled' ? postcodes.value : []),
    ...(addresses.status === 'fulfilled' ? addresses.value : []),
  ];

  const failed = [postcodes, addresses].filter((result) => result.status === 'rejected');
  // Nothing to show because a service is down is not "nothing found": the
  // customer should hear that it is worth trying again.
  if (failed.length > 0 && found.length === 0) throw failed[0]!.reason;
  for (const failure of failed) {
    logger.warn({ err: String(failure.reason) }, 'A place search service failed');
  }

  return found.slice(0, MAX_SUGGESTIONS);
}
