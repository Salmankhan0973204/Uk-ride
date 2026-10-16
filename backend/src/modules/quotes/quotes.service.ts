import { prisma } from '../../config/db.js';
import { AppError } from '../../shared/AppError.js';
import { findPostcode } from '../geo/geo.postcodes.js';
import { findRoadRoute } from '../geo/geo.routing.js';
import { publicVehicleType } from '../vehicle-types/vehicle-types.select.js';
import { calculateQuote, chargedMilesFor, isNight } from './quote.calculator.js';
import type { QuoteRequest } from './quotes.schemas.js';

/**
 * Prices a journey in every vehicle type that is on offer and has prices,
 * or in the one asked for.
 *
 * This is the thin outer layer: it reads the rules from the database and
 * hands each one to the pure calculation. All the arithmetic is in
 * quote.calculator.ts.
 *
 * Nothing is saved. A quote is an answer, not a promise: the booking in
 * Module 6 will work the price out again from the rules of that moment.
 */
export async function quoteJourney({
  pickupPostcode,
  dropoffPostcode,
  distanceMiles: typedMiles,
  pickupAt,
  airport,
  vehicleType,
}: QuoteRequest) {
  // The clock is read here, in the outer layer, never inside the calculation.
  const when = pickupAt ?? new Date();

  // With postcodes, the road distance is measured; otherwise the typed one is
  // used. The schema has made sure exactly one of the two was sent.
  const route =
    pickupPostcode && dropoffPostcode ? await measure(pickupPostcode, dropoffPostcode) : null;
  const distanceMiles = route ? route.distanceMiles : typedMiles!;

  const types = await prisma.vehicleType.findMany({
    where: {
      isActive: true,
      pricingRule: { isNot: null },
      ...(vehicleType ? { slug: vehicleType } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { ...publicVehicleType, pricingRule: true },
  });

  if (vehicleType && types.length === 0) {
    throw AppError.notFound('This vehicle type is not on offer, or has no prices yet');
  }

  const quotes = types.map(({ pricingRule, ...type }) => {
    // The query only returns types that have a rule.
    const { lines, totalPence } = calculateQuote(pricingRule!, {
      distanceMiles,
      pickupAt: when,
      airport,
    });
    return { vehicleType: type, lines, totalPence };
  });

  return {
    distanceMiles,
    // The same for every type: it depends only on the distance.
    chargedMiles: chargedMilesFor(distanceMiles),
    pickupAt: when.toISOString(),
    route,
    night: isNight(when),
    airport,
    currency: 'GBP' as const,
    quotes,
  };
}

/**
 * Finds both postcodes, at the same time, then the road route between them.
 * A route shorter than the smallest distance charged (0.1 miles) is refused:
 * two postcodes on the same street are not a journey to price.
 */
async function measure(pickupPostcode: string, dropoffPostcode: string) {
  const [pickup, dropoff] = await Promise.all([
    findPostcode(pickupPostcode, 'pickupPostcode'),
    findPostcode(dropoffPostcode, 'dropoffPostcode'),
  ]);
  const { distanceMiles, durationMinutes } = await findRoadRoute(pickup, dropoff);

  if (distanceMiles < 0.1) {
    throw AppError.validation({
      dropoffPostcode: ['These postcodes are too close together to price a journey'],
    });
  }

  return {
    pickup: { postcode: pickup.postcode, district: pickup.district },
    dropoff: { postcode: dropoff.postcode, district: dropoff.district },
    distanceMiles,
    durationMinutes,
  };
}
