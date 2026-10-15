import { prisma } from '../../config/db.js';
import { AppError } from '../../shared/AppError.js';
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
  distanceMiles,
  pickupAt,
  airport,
  vehicleType,
}: QuoteRequest) {
  // The clock is read here, in the outer layer, never inside the calculation.
  const when = pickupAt ?? new Date();

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
    night: isNight(when),
    airport,
    currency: 'GBP' as const,
    quotes,
  };
}
