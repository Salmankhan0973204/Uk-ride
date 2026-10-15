/**
 * The price of a journey, worked out from a pricing rule and the trip.
 *
 * This file is pure: no database, no HTTP, no clock, no randomness. The same
 * input always gives the same answer, so it can be tested on its own and
 * trusted wherever a price is needed (a quote now, a booking in Module 6).
 * Even the pick-up time is an input: the caller decides what "now" is.
 *
 * Every amount is whole pence. Rounding happens once per line, and the total
 * is the sum of the lines, so the breakdown a customer sees always adds up to
 * the price they pay.
 *
 * The rules are applied in this order, and the order changes the price:
 *
 *   1. base fare + distance
 *   2. topped up to the minimum fare
 *   3. night surcharge: a percentage of 1 and 2
 *   4. airport fee: a flat amount, not increased by the night surcharge
 */

/** The parts of a pricing rule the calculation needs. */
export interface PriceRule {
  baseFarePence: number;
  perMilePence: number;
  minimumFarePence: number;
  /** 25 means 25%. 0 means no night surcharge. */
  nightSurchargePercent: number;
  airportFeePence: number;
}

export interface Trip {
  /** Miles, counted to the nearest tenth: 12.44 is charged as 12.4. */
  distanceMiles: number;
  /** When the passenger is picked up. Decides the night surcharge. */
  pickupAt: Date;
  /** To or from an airport. */
  airport: boolean;
}

export type QuoteLineCode =
  'BASE_FARE' | 'DISTANCE' | 'MINIMUM_FARE_TOP_UP' | 'NIGHT_SURCHARGE' | 'AIRPORT_FEE';

/** One line of the breakdown. */
export interface QuoteLine {
  code: QuoteLineCode;
  label: string;
  amountPence: number;
}

export interface Quote {
  /** The distance actually charged, after rounding to a tenth of a mile. */
  chargedMiles: number;
  /** Whether the pick-up falls in the night hours. */
  night: boolean;
  lines: QuoteLine[];
  totalPence: number;
}

/** The longest journey the calculation accepts. */
export const MAX_MILES = 1000;

/**
 * Night hours, UK time: from 22:00 up to, not including, 06:00. The firm
 * works to the clock on the wall in the UK, which is GMT in winter and BST
 * (GMT+1) in summer.
 */
export const NIGHT_STARTS_AT = 22;
export const NIGHT_ENDS_AT = 6;
const UK_TIME_ZONE = 'Europe/London';

/** The distance that is charged: the nearest tenth of a mile. 12.44 → 12.4. */
export function chargedMilesFor(distanceMiles: number) {
  return Math.round(distanceMiles * 10) / 10;
}

/** 1250 → "£12.50". For labels only; amounts stay in pence. */
export function formatPence(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

/** The hour on a UK clock at that moment, 0 to 23. */
export function ukHour(moment: Date) {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIME_ZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(moment);
  return Number(hour);
}

/** Whether a pick-up at that moment is in the night hours. */
export function isNight(moment: Date) {
  const hour = ukHour(moment);
  return hour >= NIGHT_STARTS_AT || hour < NIGHT_ENDS_AT;
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
  if (Number.isNaN(trip.pickupAt.getTime())) {
    throw new RangeError('pickupAt must be a valid date');
  }

  // Count in tenths of a mile, as whole numbers, so no fractions of a penny
  // pile up: 12.4 miles is 124 tenths.
  const chargedMiles = chargedMilesFor(trip.distanceMiles);
  const tenths = Math.round(chargedMiles * 10);
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

  // 2. A short trip costs at least the minimum fare. The difference is shown
  // as its own line, so the breakdown still adds up and says why.
  const subtotal = sum(lines);
  if (subtotal < rule.minimumFarePence) {
    lines.push({
      code: 'MINIMUM_FARE_TOP_UP',
      label: `Minimum fare is ${formatPence(rule.minimumFarePence)}`,
      amountPence: rule.minimumFarePence - subtotal,
    });
  }

  // 3. The night surcharge is a share of the fare so far, rounded once.
  const night = isNight(trip.pickupAt);
  if (night && rule.nightSurchargePercent > 0) {
    lines.push({
      code: 'NIGHT_SURCHARGE',
      label: `Night-time pick-up, 10pm to 6am: ${rule.nightSurchargePercent}%`,
      amountPence: Math.round((sum(lines) * rule.nightSurchargePercent) / 100),
    });
  }

  // 4. The airport fee covers parking and access charges, which do not go
  // up at night, so it comes last and is not part of the percentage.
  if (trip.airport && rule.airportFeePence > 0) {
    lines.push({
      code: 'AIRPORT_FEE',
      label: 'Airport pick-up or drop-off',
      amountPence: rule.airportFeePence,
    });
  }

  return { chargedMiles, night, lines, totalPence: sum(lines) };
}

const sum = (lines: QuoteLine[]) => lines.reduce((total, line) => total + line.amountPence, 0);
