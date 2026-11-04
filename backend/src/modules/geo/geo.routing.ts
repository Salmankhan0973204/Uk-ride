import { env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';
import { TtlCache } from './geo.cache.js';
import { LOOKUP_TIMEOUT_MS, serviceDown } from './geo.postcodes.js';

/** A position on the map. */
export interface Point {
  latitude: number;
  longitude: number;
}

/** One driving route through two or more places, in order. */
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
 * The road distance from the first place to the last, through every place in
 * between in the order given: a journey with stops is one route. From an
 * OSRM routing server working on OpenStreetMap roads.
 *
 * By default that is the public OSRM demo server: free and without a key,
 * but with no promise of staying up. ROUTING_API_URL points it somewhere
 * else (another host, or our own OSRM in Docker) without changing code.
 *
 * Only the map positions are sent, never a name or an address. `field`
 * names the request field a "no road route" answer is reported on.
 */
export async function findRoadRoute(points: Point[], field = 'dropoff'): Promise<RoadRoute> {
  if (points.length < 2) throw new RangeError('A route needs at least two places');

  // OSRM wants longitude first, then latitude.
  const path = points.map((point) => `${point.longitude},${point.latitude}`).join(';');
  const cached = cache.get(path);
  if (cached) return cached;

  let answer: OsrmAnswer;
  try {
    const response = await fetch(`${env.ROUTING_API_URL}/route/v1/driving/${path}?overview=false`, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    answer = (await response.json()) as OsrmAnswer;
  } catch {
    throw serviceDown('route');
  }

  // NoRoute: no road joins the places, for example one of them is on an island.
  if (answer.code === 'NoRoute') {
    throw AppError.validation(
      { [field]: ['There is no road route between these places'] },
      'There is no road route between these places',
    );
  }
  const route = answer.routes?.[0];
  if (answer.code !== 'Ok' || !route) throw serviceDown('route');

  const result: RoadRoute = {
    distanceMiles: Math.round((route.distance / METRES_PER_MILE) * 100) / 100,
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
  };
  cache.set(path, result);
  return result;
}
