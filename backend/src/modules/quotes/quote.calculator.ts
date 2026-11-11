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
 * A trip is one leg, or two with a return. Each leg is priced on its own, in
 * this order, and the order changes the price:
 *
 *   1. base fare + distance (the whole route, through any stops)
 *   2. topped up to the minimum fare
 *   3. night surcharge: a percentage of 1 and 2, by the leg's pick-up time
 *   4. airport fee: a flat amount when the leg starts, stops or ends at an
 *      airport, not increased by the night surcharge
 *      = the original price, which ukride.uk shows struck through
 *   5. the class discount: a percentage of the original price, taken off
 *      = the fare
 *   6. Meet & Greet, when chosen on an airport pick-up: a flat amount, never
 *      discounted
 *      = the leg's total
 */

/** The parts of a pricing rule the calculation needs. */
export interface PriceRule {
  baseFarePence: number;
  perMilePence: number;
  minimumFarePence: number;
  /** 25 means 25%. 0 means no night surcharge. */
  nightSurchargePercent: number;
  airportFeePence: number;
  /** 10 means 10% off. 0 means no discount. */
  discountPercent: number;
}

export interface Leg {
  /** By road, through every stop. Counted to the nearest tenth: 12.44 is charged as 12.4. */
  distanceMiles: number;
  /** When the passenger is picked up. Decides the night surcharge. */
  pickupAt: Date;
  /** The leg starts, stops or ends at an airport: the airport fee applies. */
  airport: boolean;
  /** The leg starts at an airport: the only place Meet & Greet is offered. */
  airportPickup: boolean;
  /** Meet & Greet was chosen for this leg. */
  meetGreet: boolean;
}

/** Prices that come from the operator's settings, not from the class. */
export interface Extras {
  meetGreetPence: number;
}

/** The kinds of line a breakdown can have, in the order they are added. */
export const QUOTE_LINE_CODES = [
  'BASE_FARE',
  'DISTANCE',
  'MINIMUM_FARE_TOP_UP',
  'NIGHT_SURCHARGE',
  'AIRPORT_FEE',
  'DISCOUNT',
  'MEET_AND_GREET',
] as const;

export type QuoteLineCode = (typeof QUOTE_LINE_CODES)[number];

/** One line of the breakdown. A discount is a negative amount. */
export interface QuoteLine {
  code: QuoteLineCode;
  label: string;
  amountPence: number;
}

/** The price of one leg. Every amount is whole pence. */
export interface LegPrice {
  /** The distance actually charged, after rounding to a tenth of a mile. */
  chargedMiles: number;
  /** Whether the pick-up falls in the night hours. */
  night: boolean;
  lines: QuoteLine[];
  /** Lines 1 to 4: before the discount. */
  originalPence: number;
  /** What the discount takes off, as a positive number. */
  discountPence: number;
  /** The original price less the discount. */
  farePence: number;
  /** 0 unless Meet & Greet was chosen. */
  meetGreetPence: number;
  /** The fare plus Meet & Greet: the sum of the lines. */
  totalPence: number;
}

/** The price of a whole trip: each leg, and the sums of their amounts. */
export interface TripPrice {
  legs: LegPrice[];
  originalPence: number;
  discountPence: number;
  farePence: number;
  meetGreetPence: number;
  totalPence: number;
}

/** The longest leg the calculation accepts. */
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

const sum = (lines: QuoteLine[]) => lines.reduce((total, line) => total + line.amountPence, 0);

/** The Meet & Greet line: the one line a booking adds to a saved quote. */
export function meetGreetLine(amountPence: number): QuoteLine {
  return { code: 'MEET_AND_GREET', label: 'Meet & Greet in arrivals', amountPence };
}

export function priceLeg(rule: PriceRule, leg: Leg, extras: Extras): LegPrice {
  // The API checks these first. Reaching here with bad input is a bug, so it
  // fails loudly rather than producing a price.
  if (!Number.isFinite(leg.distanceMiles) || leg.distanceMiles <= 0) {
    throw new RangeError('distanceMiles must be a number above 0');
  }
  if (leg.distanceMiles > MAX_MILES) {
    throw new RangeError(`distanceMiles must be at most ${MAX_MILES}`);
  }
  if (Number.isNaN(leg.pickupAt.getTime())) {
    throw new RangeError('pickupAt must be a valid date');
  }
  if (leg.meetGreet && !leg.airportPickup) {
    throw new RangeError('Meet & Greet is only for a pick-up at an airport');
  }
  if (rule.discountPercent < 0 || rule.discountPercent > 100) {
    throw new RangeError('discountPercent must be from 0 to 100');
  }

  // Count in tenths of a mile, as whole numbers, so no fractions of a penny
  // pile up: 12.4 miles is 124 tenths.
  const chargedMiles = chargedMilesFor(leg.distanceMiles);
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
  const night = isNight(leg.pickupAt);
  if (night && rule.nightSurchargePercent > 0) {
    lines.push({
      code: 'NIGHT_SURCHARGE',
      label: `Night-time pick-up, 10pm to 6am: ${rule.nightSurchargePercent}%`,
      amountPence: Math.round((sum(lines) * rule.nightSurchargePercent) / 100),
    });
  }

  // 4. The airport fee covers parking and access charges, which do not go
  // up at night, so it is not part of the percentage.
  if (leg.airport && rule.airportFeePence > 0) {
    lines.push({
      code: 'AIRPORT_FEE',
      label: 'Airport pick-up or drop-off',
      amountPence: rule.airportFeePence,
    });
  }
  const originalPence = sum(lines);

  // 5. The discount is a share of the whole original price, rounded once, so
  // "10% off" is exactly what the struck-through price suggests.
  const discountPence = Math.round((originalPence * rule.discountPercent) / 100);
  if (discountPence > 0) {
    lines.push({
      code: 'DISCOUNT',
      label: `Discount: ${rule.discountPercent}% off`,
      amountPence: -discountPence,
    });
  }
  const farePence = originalPence - discountPence;

  // 6. Meet & Greet is a service with its own price, not part of the fare.
  const meetGreetPence = leg.meetGreet ? extras.meetGreetPence : 0;
  if (meetGreetPence > 0) lines.push(meetGreetLine(meetGreetPence));

  return {
    chargedMiles,
    night,
    lines,
    originalPence,
    discountPence,
    farePence,
    meetGreetPence,
    totalPence: sum(lines),
  };
}

/**
 * Prices every leg of a trip in one class. A return is two legs, each with
 * its own pick-up time, so one can be at night and the other not.
 */
export function priceTrip(rule: PriceRule, legs: Leg[], extras: Extras): TripPrice {
  if (legs.length === 0) throw new RangeError('A trip has at least one leg');

  const priced = legs.map((leg) => priceLeg(rule, leg, extras));
  const total = (pick: (leg: LegPrice) => number) =>
    priced.reduce((sum, leg) => sum + pick(leg), 0);

  return {
    legs: priced,
    originalPence: total((leg) => leg.originalPence),
    discountPence: total((leg) => leg.discountPence),
    farePence: total((leg) => leg.farePence),
    meetGreetPence: total((leg) => leg.meetGreetPence),
    totalPence: total((leg) => leg.totalPence),
  };
}

/** How many people and bags a class takes, or a party brings. */
export interface Load {
  passengers: number;
  suitcases: number;
  handLuggage: number;
}

/**
 * Whether a party fits a class. Every passenger needs a seat and every
 * suitcase needs suitcase room. A hand bag is smaller, so it may also go in
 * suitcase room the party does not use: a class for 3 suitcases and 3 hand
 * bags takes 1 suitcase and 5 hand bags.
 */
export function fits(capacity: Load, party: Load) {
  return (
    party.passengers <= capacity.passengers &&
    party.suitcases <= capacity.suitcases &&
    party.suitcases + party.handLuggage <= capacity.suitcases + capacity.handLuggage
  );
}

/** The first class, in list order, that the party fits; undefined when none does. */
export function recommend<T extends Load>(classes: readonly T[], party: Load): T | undefined {
  return classes.find((capacity) => fits(capacity, party));
}

/** The price of one leg as a quote saved it: lines 1 to 5, before Meet & Greet. */
export interface SavedLegPrice {
  lines: QuoteLine[];
  originalPence: number;
  discountPence: number;
  /** The original price less the discount: what the quote shows for the leg. */
  pricePence: number;
}

/** What the customer chose for one leg when booking. */
export interface LegChoice {
  /** The leg starts at an airport, the only place Meet & Greet is offered. */
  airportPickup: boolean;
  meetGreet: boolean;
}

/** A booked leg's price: the saved figures, plus Meet & Greet where chosen. */
export type BookedLegPrice = Omit<LegPrice, 'chargedMiles' | 'night'>;

/**
 * The price of a booked class, from a saved quote. Nothing is worked out
 * again: the quote is the contract, and this only adds the one line the
 * quote left open, Meet & Greet, at the price the quote saved for it.
 *
 * A saved price whose lines do not add up is a bug somewhere: it fails loudly
 * and is never booked.
 */
export function priceChoice(
  saved: SavedLegPrice[],
  choices: LegChoice[],
  meetGreetPence: number,
): { legs: BookedLegPrice[]; totalPence: number } {
  if (saved.length === 0) throw new RangeError('A trip has at least one leg');
  if (saved.length !== choices.length) throw new RangeError('One choice per leg');

  const legs = saved.map((leg, index): BookedLegPrice => {
    const choice = choices[index]!;
    if (choice.meetGreet && !choice.airportPickup) {
      throw new RangeError('Meet & Greet is only for a pick-up at an airport');
    }
    const added = choice.meetGreet ? meetGreetPence : 0;
    const lines = added > 0 ? [...leg.lines, meetGreetLine(added)] : [...leg.lines];
    const price: BookedLegPrice = {
      lines,
      originalPence: leg.originalPence,
      discountPence: leg.discountPence,
      farePence: leg.pricePence,
      meetGreetPence: added,
      totalPence: leg.pricePence + added,
    };
    if (
      sum(lines) !== price.totalPence ||
      price.farePence !== price.originalPence - price.discountPence
    ) {
      throw new RangeError('The saved price does not add up');
    }
    return price;
  });

  return { legs, totalPence: legs.reduce((total, leg) => total + leg.totalPence, 0) };
}
