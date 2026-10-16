import { env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';
import { TtlCache } from './geo.cache.js';
import { LOOKUP_TIMEOUT_MS, serviceDown } from './geo.postcodes.js';
import type { Place } from './geo.postcodes.js';

/** One driving route between two places. */
export interface RoadRoute {
  /** By road, to two decimal places. */
  distanceMiles: number;
  /** Driving time without traffic, in whole minutes. */
  durationMinutes: number;
}

const METRES_PER_MILE = 1609.344;

const cache = new TtlCache<RoadRoute>();

interface OsrmAnswer {
  code: string;
  routes?: { distance: number; duration: number }[];
}

/**
 * The road distance from one place to another, from an OSRM routing server
 * working on OpenStreetMap roads.
 *
 * By default that is the public OSRM demo server: free and without a key,
 * but with no promise of staying up. ROUTING_API_URL points it somewhere
 * else (another host, or our own OSRM in Docker) without changing code.
 *
 * Only the two map positions are sent, never a name or an address.
 */
export async function findRoadRoute(from: Place, to: Place): Promise<RoadRoute> {
  // OSRM wants longitude first, then latitude.
  const points = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const cached = cache.get(points);
  if (cached) return cached;

  let answer: OsrmAnswer;
  try {
    const response = await fetch(
      `${env.ROUTING_API_URL}/route/v1/driving/${points}?overview=false`,
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    answer = (await response.json()) as OsrmAnswer;
  } catch {
    throw serviceDown('route');
  }

  // NoRoute: no road joins the two, for example a postcode on an island.
  if (answer.code === 'NoRoute') {
    throw AppError.validation(
      { dropoffPostcode: ['There is no road route between these postcodes'] },
      'There is no road route between these postcodes',
    );
  }
  const route = answer.routes?.[0];
  if (answer.code !== 'Ok' || !route) throw serviceDown('route');

  const result: RoadRoute = {
    distanceMiles: Math.round((route.distance / METRES_PER_MILE) * 100) / 100,
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
  };
  cache.set(points, result);
  return result;
}
