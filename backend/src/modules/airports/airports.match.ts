import { normalisePostcode } from '../geo/geo.postcodes.js';

/** The parts of an airport that recognising it needs. */
export interface AirportPostcodes {
  postcode: string;
  postcodes: string[];
}

/**
 * The shape of an entry in an airport's postcode list, after tidying:
 * a district ("TW6"), a sector ("RH6 0"), part of a postcode ("RH6 0P")
 * or a whole postcode ("RH6 0PJ").
 */
const ENTRY = /^[A-Z]{1,2}\d[A-Z\d]?( \d[A-Z]{0,2})?$/;

/**
 * " rh60pj " → "RH6 0PJ", "tw6" → "TW6", "rh6  0" → "RH6 0", or undefined
 * when the text is none of those.
 *
 * Without a space, a whole postcode is recognised by its shape; a sector
 * must be typed with its space, because "RH60" could be RH6 0 or RH60.
 */
export function normaliseAirportPostcode(text: string): string | undefined {
  const whole = normalisePostcode(text);
  if (whole) return whole;
  const tidy = text.trim().toUpperCase().replace(/\s+/g, ' ');
  return ENTRY.test(tidy) ? tidy : undefined;
}

/**
 * Whether a postcode is covered by one entry of a list. The comparison is by
 * parts, not by letters: "E1" covers "E1 6AN" but not "E16 2PX", although
 * "E16 2PX" starts with the letters "E1".
 */
export function postcodeMatches(postcode: string, entry: string) {
  const [outward, inward = ''] = postcode.split(' ');
  const [entryOutward, entryInward = ''] = entry.split(' ');
  return outward === entryOutward && inward.startsWith(entryInward);
}

/** The first airport whose main postcode or list covers the postcode, if any. */
export function airportFor<T extends AirportPostcodes>(
  postcode: string | null | undefined,
  airports: readonly T[],
): T | undefined {
  if (!postcode) return undefined;
  return airports.find(
    (airport) =>
      airport.postcode === postcode ||
      airport.postcodes.some((entry) => postcodeMatches(postcode, entry)),
  );
}
