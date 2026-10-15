/**
 * The price of a journey, worked out from a pricing rule and the trip.
 *
 * This file is pure: no database, no HTTP, no clock, no randomness. The same
 * input always gives the same answer, so it can be tested on its own and
 * trusted wherever a price is needed (a quote now, a booking in Module 6).
 *
 * Every amount is whole pence. Rounding happens once per line, and the total
 * is the sum of the lines, so the breakdown a customer sees always adds up to
 * the price they pay.
 */

/** The parts of a pricing rule the calculation needs. */
export interface PriceRule {
  baseFarePence: number;
  perMilePence: number;
  minimumFarePence: number;
}

export interface Trip {
  /** Miles, counted to the nearest tenth: 12.44 is charged as 12.4. */
  distanceMiles: number;
}

export type QuoteLineCode = 'BASE_FARE' | 'DISTANCE' | 'MINIMUM_FARE_TOP_UP';

/** One line of the breakdown. */
export interface QuoteLine {
  code: QuoteLineCode;
  label: string;
  amountPence: number;
}

export interface Quote {
  /** The distance actually charged, after rounding to a tenth of a mile. */
  chargedMiles: number;
  lines: QuoteLine[];
  totalPence: number;
}

/** The longest journey the calculation accepts. */
export const MAX_MILES = 1000;

/** 1250 → "£12.50". For labels only; amounts stay in pence. */
export function formatPence(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function calculateQuote(rule: PriceRule, trip: Trip): Quote {
  // The API checks these first. Reaching here with bad input is a bug, so it
  // fails loudly rather than producing a price.
  if (!Number.isFinite(trip.distanceMiles) || trip.distanceMiles <= 0) {
    throw new RangeError('distanceMiles must be a number above 0');
  }
  if (trip.distanceMiles > MAX_MILES) {
    throw new RangeError(`distanceMiles must be at most ${MAX_MILES}`);
  }

  // Count in tenths of a mile, as whole numbers, so no fractions of a penny
  // pile up: 12.4 miles is 124 tenths.
  const tenths = Math.round(trip.distanceMiles * 10);
  const chargedMiles = tenths / 10;
  // 124 tenths at 210p a mile is 124 × 210 / 10 = 2604p. Rounded to the
  // nearest penny, once.
  const distancePence = Math.round((tenths * rule.perMilePence) / 10);

  const lines: QuoteLine[] = [
    { code: 'BASE_FARE', label: 'Base fare', amountPence: rule.baseFarePence },
    {
      code: 'DISTANCE',
      label: `${chargedMiles} ${chargedMiles === 1 ? 'mile' : 'miles'} at ${formatPence(rule.perMilePence)} a mile`,
      amountPence: distancePence,
    },
  ];

  // A short trip costs at least the minimum fare. The difference is shown as
  // its own line, so the breakdown still adds up and says why.
  const subtotal = sum(lines);
  if (subtotal < rule.minimumFarePence) {
    lines.push({
      code: 'MINIMUM_FARE_TOP_UP',
      label: `Minimum fare is ${formatPence(rule.minimumFarePence)}`,
      amountPence: rule.minimumFarePence - subtotal,
    });
  }

  return { chargedMiles, lines, totalPence: sum(lines) };
}

const sum = (lines: QuoteLine[]) => lines.reduce((total, line) => total + line.amountPence, 0);
