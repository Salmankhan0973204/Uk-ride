import { airportFor } from '../airports/airports.match.js';
import { listServedAirports } from '../airports/airports.service.js';
import type { ServedAirport } from '../airports/airports.service.js';
import { MAX_SUGGESTIONS, searchPlaces } from '../geo/geo.places.js';
import type { PlaceSuggestion } from '../geo/geo.places.js';

/** A suggestion as the API answers it: what the map search found, and whether it is an airport. */
export interface Place extends Omit<PlaceSuggestion, 'kind'> {
  kind: PlaceSuggestion['kind'] | 'airport';
  /** Set when the place is at one of our airports, by its postcode. */
  airport: { code: string; name: string } | null;
}

/** At most this many of our airports head the list, so other places still show. */
const MAX_AIRPORTS = 4;

const airportPlace = (airport: ServedAirport): Place => ({
  label: airport.name,
  detail: `${airport.code}, ${airport.postcode}`,
  latitude: airport.latitude,
  longitude: airport.longitude,
  postcode: airport.postcode,
  kind: 'airport',
  airport: { code: airport.code, name: airport.name },
});

/** "heath", "LHR", "airport" find Heathrow Airport. */
function airportMatches(airport: ServedAirport, text: string) {
  const typed = text.toLowerCase();
  return airport.code.toLowerCase() === typed || airport.name.toLowerCase().includes(typed);
}

/**
 * Suggestions for an address box: our airports first when the text names
 * one, then what the map search finds.
 *
 * Each map result is checked against the airports by its postcode, so
 * "Heathrow Terminal 5" (TW6 2GD) is marked as Heathrow. The quote checks
 * again on the server; this mark is only there to show the customer.
 */
export async function suggestPlaces(text: string): Promise<Place[]> {
  const [airports, search] = await Promise.all([
    listServedAirports(),
    searchPlaces(text).then(
      (places) => ({ places }),
      (error: unknown) => ({ error }),
    ),
  ]);

  const named = airports.filter((airport) => airportMatches(airport, text)).slice(0, MAX_AIRPORTS);
  const names = new Set(named.map((airport) => airport.name.toLowerCase()));

  // Our own airports need no outside service, so they are still suggested
  // when the map search is down. With nothing at all to show, it is a 503.
  if ('error' in search && named.length === 0) throw search.error;
  const found = 'places' in search ? search.places : [];

  const places = found
    // The map's own "Gatwick Airport" would sit right under ours, at another spot.
    .filter((place) => !names.has(place.label.toLowerCase()))
    .map((place): Place => {
      const airport = airportFor(place.postcode, airports);
      return { ...place, airport: airport ? { code: airport.code, name: airport.name } : null };
    });

  return [...named.map(airportPlace), ...places].slice(0, MAX_SUGGESTIONS);
}
