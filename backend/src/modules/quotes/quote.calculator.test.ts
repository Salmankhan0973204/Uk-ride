import { describe, expect, it } from 'vitest';
import {
  fits,
  formatPence,
  isNight,
  meetGreetLine,
  priceChoice,
  priceLeg,
  priceTrip,
  recommend,
  ukHour,
} from './quote.calculator.js';
import type { Leg, LegPrice, PriceRule, SavedLegPrice } from './quote.calculator.js';

// Example prices for the tests: £3.50 to start, £2.10 a mile, £12.00 at least.
// No surcharges and no discount here; the tests below switch them on.
const rule: PriceRule = {
  baseFarePence: 350,
  perMilePence: 210,
  minimumFarePence: 1200,
  nightSurchargePercent: 0,
  airportFeePence: 0,
  discountPercent: 0,
};

// Meet & Greet at £10, as in the default settings.
const extras = { meetGreetPence: 1000 };

// Midday, nowhere near an airport: no surcharge can apply.
const day: Omit<Leg, 'distanceMiles'> = {
  pickupAt: new Date('2026-03-10T12:00:00Z'),
  airport: false,
  airportPickup: false,
  meetGreet: false,
};

const price = (r: PriceRule, leg: Partial<Leg> & { distanceMiles: number }) =>
  priceLeg(r, { ...day, ...leg }, extras);

const amounts = (leg: LegPrice) =>
  Object.fromEntries(leg.lines.map((line) => [line.code, line.amountPence]));

const added = (leg: LegPrice) => leg.lines.reduce((total, line) => total + line.amountPence, 0);

describe('priceLeg', () => {
  it('adds the base fare and the distance', () => {
    const leg = price(rule, { distanceMiles: 10 });

    expect(amounts(leg)).toEqual({ BASE_FARE: 350, DISTANCE: 2100 });
    expect(leg.totalPence).toBe(2450);
  });

  it('counts the distance to the nearest tenth of a mile', () => {
    expect(price(rule, { distanceMiles: 12.44 }).chargedMiles).toBe(12.4);
    expect(price(rule, { distanceMiles: 12.45 }).chargedMiles).toBe(12.5);
    // 12.44 miles is charged as 12.4: 124 tenths × 210p / 10 = 2604p.
    expect(amounts(price(rule, { distanceMiles: 12.44 })).DISTANCE).toBe(2604);
  });

  it('rounds the distance charge to the nearest penny, once', () => {
    // 11 tenths × 333p / 10 = 366.3p, which is 366p.
    expect(amounts(price({ ...rule, perMilePence: 333 }, { distanceMiles: 1.1 })).DISTANCE).toBe(
      366,
    );
    // 11 tenths × 335p / 10 = 368.5p, which rounds up to 369p. Rounding down
    // would give 368p, and the test above would not notice.
    expect(amounts(price({ ...rule, perMilePence: 335 }, { distanceMiles: 1.1 })).DISTANCE).toBe(
      369,
    );
  });

  it('tops a short trip up to the minimum fare, on a line of its own', () => {
    // £3.50 + 2 miles at £2.10 = £7.70, below the £12.00 minimum.
    const leg = price(rule, { distanceMiles: 2 });

    expect(amounts(leg)).toEqual({ BASE_FARE: 350, DISTANCE: 420, MINIMUM_FARE_TOP_UP: 430 });
    expect(leg.totalPence).toBe(1200);
  });

  it('adds no top-up when the fare is exactly the minimum', () => {
    // £3.50 + 4 miles at £2.10 = £11.90, and the minimum is set to exactly £11.90.
    const exact = price({ ...rule, minimumFarePence: 1190 }, { distanceMiles: 4 });

    expect(exact.lines.map((line) => line.code)).toEqual(['BASE_FARE', 'DISTANCE']);
    expect(exact.totalPence).toBe(1190);
  });

  it('works with a free base fare or free miles', () => {
    expect(price({ ...rule, baseFarePence: 0 }, { distanceMiles: 10 }).totalPence).toBe(2100);
    expect(price({ ...rule, perMilePence: 0 }, { distanceMiles: 10 }).totalPence).toBe(1200);
  });

  it('describes each line in words', () => {
    const leg = price(
      { ...rule, discountPercent: 10 },
      {
        distanceMiles: 1,
        airport: true,
        airportPickup: true,
        meetGreet: true,
      },
    );

    expect(leg.lines.map((line) => line.label)).toEqual([
      'Base fare',
      '1 mile at £2.10 a mile',
      'Minimum fare is £12.00',
      'Discount: 10% off',
      'Meet & Greet in arrivals',
    ]);
  });

  it('refuses a distance that is not a positive number up to 1000 miles', () => {
    for (const distanceMiles of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, 1000.1]) {
      expect(() => price(rule, { distanceMiles })).toThrow(RangeError);
    }
  });

  it('refuses a pick-up time that is not a date', () => {
    expect(() => price(rule, { distanceMiles: 5, pickupAt: new Date('not a date') })).toThrow(
      RangeError,
    );
  });
});

describe('surcharges', () => {
  // 25% at night, £5.00 for an airport.
  const withSurcharges: PriceRule = { ...rule, nightSurchargePercent: 25, airportFeePence: 500 };
  // In winter the UK is on GMT, so UK time equals UTC.
  const winterNight = new Date('2026-01-15T23:00:00Z');

  it('adds the night surcharge as a share of the fare', () => {
    // £3.50 + 10 miles at £2.10 = £24.50; 25% of that is £6.125, so 613p.
    const leg = price(withSurcharges, { distanceMiles: 10, pickupAt: winterNight });

    expect(leg.night).toBe(true);
    expect(amounts(leg)).toEqual({ BASE_FARE: 350, DISTANCE: 2100, NIGHT_SURCHARGE: 613 });
    expect(leg.totalPence).toBe(3063);
  });

  it('works out the night surcharge after the minimum fare', () => {
    // 2 miles is topped up to £12.00 first; 25% of £12.00 is £3.00.
    const leg = price(withSurcharges, { distanceMiles: 2, pickupAt: winterNight });

    expect(amounts(leg).NIGHT_SURCHARGE).toBe(300);
    expect(leg.totalPence).toBe(1500);
  });

  it('adds the airport fee after the night surcharge, without the surcharge on it', () => {
    const leg = price(withSurcharges, { distanceMiles: 10, pickupAt: winterNight, airport: true });

    expect(leg.lines.map((line) => line.code)).toEqual([
      'BASE_FARE',
      'DISTANCE',
      'NIGHT_SURCHARGE',
      'AIRPORT_FEE',
    ]);
    // 2450 + 613 + 500. A surcharge on the fee too would make it 3688.
    expect(leg.totalPence).toBe(3563);
  });

  it('adds the airport fee by day as well', () => {
    const leg = price(withSurcharges, { distanceMiles: 10, airport: true });
    expect(amounts(leg)).toEqual({ BASE_FARE: 350, DISTANCE: 2100, AIRPORT_FEE: 500 });
  });

  it('adds no lines for surcharges set to 0', () => {
    const leg = price(rule, { distanceMiles: 10, pickupAt: winterNight, airport: true });

    expect(leg.night).toBe(true);
    expect(leg.lines.map((line) => line.code)).toEqual(['BASE_FARE', 'DISTANCE']);
  });

  it('counts night from 22:00 up to, not including, 06:00, UK time', () => {
    const at = (time: string) => isNight(new Date(`2026-01-15T${time}:00Z`));

    expect(at('21:59')).toBe(false);
    expect(at('22:00')).toBe(true);
    expect(at('03:00')).toBe(true);
    expect(at('05:59')).toBe(true);
    expect(at('06:00')).toBe(false);
  });

  it('follows the UK clock through British Summer Time', () => {
    // In July the UK is on BST, an hour ahead of UTC.
    // 21:30 UTC is 22:30 in London: night.
    expect(ukHour(new Date('2026-07-01T21:30:00Z'))).toBe(22);
    expect(isNight(new Date('2026-07-01T21:30:00Z'))).toBe(true);
    // 05:30 UTC is 06:30 in London: day.
    expect(isNight(new Date('2026-07-01T05:30:00Z'))).toBe(false);
    // The same UTC times in January, on GMT, give the opposite answers.
    expect(isNight(new Date('2026-01-15T21:30:00Z'))).toBe(false);
    expect(isNight(new Date('2026-01-15T05:30:00Z'))).toBe(true);
  });
});

describe('discount', () => {
  const tenOff: PriceRule = { ...rule, discountPercent: 10, airportFeePence: 500 };

  it('takes a share of the original price off, on a negative line', () => {
    // £3.50 + 10 miles at £2.10 = £24.50 original; 10% off is £2.45.
    const leg = price(tenOff, { distanceMiles: 10 });

    expect(leg.originalPence).toBe(2450);
    expect(leg.discountPence).toBe(245);
    expect(amounts(leg).DISCOUNT).toBe(-245);
    expect(leg.farePence).toBe(2205);
    expect(leg.totalPence).toBe(2205);
  });

  it('discounts the airport fee and the night surcharge too: the whole original price', () => {
    const leg = price(
      { ...tenOff, nightSurchargePercent: 25 },
      { distanceMiles: 10, pickupAt: new Date('2026-01-15T23:00:00Z'), airport: true },
    );

    // 2450 + 613 night + 500 airport = 3563; 10% of that is 356.3, so 356p.
    expect(leg.originalPence).toBe(3563);
    expect(leg.discountPence).toBe(356);
    expect(leg.farePence).toBe(3207);
  });

  it('rounds the discount to the nearest penny, once', () => {
    // 15% of £24.50 is 367.5p, which rounds to 368p.
    expect(price({ ...rule, discountPercent: 15 }, { distanceMiles: 10 }).discountPence).toBe(368);
  });

  it('adds no line when there is no discount', () => {
    const leg = price(rule, { distanceMiles: 10 });

    expect(leg.discountPence).toBe(0);
    expect(leg.lines.some((line) => line.code === 'DISCOUNT')).toBe(false);
    expect(leg.farePence).toBe(leg.originalPence);
  });
});

describe('Meet & Greet', () => {
  const airportPickup = { airport: true, airportPickup: true };

  it('adds its price to an airport pick-up when chosen', () => {
    const leg = price(rule, { distanceMiles: 10, ...airportPickup, meetGreet: true });

    expect(amounts(leg).MEET_AND_GREET).toBe(1000);
    expect(leg.meetGreetPence).toBe(1000);
    expect(leg.totalPence).toBe(2450 + 1000);
  });

  it('is never discounted, and comes after the discount', () => {
    const leg = price(
      { ...rule, discountPercent: 50 },
      {
        distanceMiles: 10,
        ...airportPickup,
        meetGreet: true,
      },
    );

    expect(leg.lines.map((line) => line.code).slice(-2)).toEqual(['DISCOUNT', 'MEET_AND_GREET']);
    // Half of £24.50 off, then the whole £10.
    expect(leg.farePence).toBe(1225);
    expect(leg.totalPence).toBe(2225);
  });

  it('costs nothing when not chosen', () => {
    const leg = price(rule, { distanceMiles: 10, ...airportPickup });

    expect(leg.meetGreetPence).toBe(0);
    expect(leg.totalPence).toBe(leg.farePence);
  });

  it('is refused on a pick-up that is not at an airport', () => {
    // Dropping off at an airport is not enough: nobody waits in arrivals.
    expect(() =>
      price(rule, { distanceMiles: 10, airport: true, airportPickup: false, meetGreet: true }),
    ).toThrow(RangeError);
  });
});

describe('priceTrip', () => {
  const withSurcharges: PriceRule = {
    ...rule,
    nightSurchargePercent: 25,
    airportFeePence: 500,
    discountPercent: 10,
  };
  const outbound: Leg = {
    distanceMiles: 16.2,
    pickupAt: new Date('2026-03-10T12:00:00Z'),
    airport: true,
    airportPickup: false,
    meetGreet: false,
  };
  // Back from the airport late at night, with Meet & Greet.
  const back: Leg = {
    distanceMiles: 16.9,
    pickupAt: new Date('2026-03-17T23:30:00Z'),
    airport: true,
    airportPickup: true,
    meetGreet: true,
  };

  it('prices each leg on its own and adds them up', () => {
    const trip = priceTrip(withSurcharges, [outbound, back], extras);
    const [first, second] = trip.legs;

    expect(first!.night).toBe(false);
    expect(second!.night).toBe(true);
    expect(first!.meetGreetPence).toBe(0);
    expect(second!.meetGreetPence).toBe(1000);
    expect(trip.totalPence).toBe(first!.totalPence + second!.totalPence);
    expect(trip.originalPence).toBe(first!.originalPence + second!.originalPence);
    expect(trip.discountPence).toBe(first!.discountPence + second!.discountPence);
    expect(trip.farePence).toBe(trip.originalPence - trip.discountPence);
    expect(trip.totalPence).toBe(trip.farePence + trip.meetGreetPence);
  });

  it('works out a one-way trip as its single leg', () => {
    const trip = priceTrip(withSurcharges, [outbound], extras);
    expect(trip.totalPence).toBe(priceLeg(withSurcharges, outbound, extras).totalPence);
  });

  it('refuses a trip with no legs', () => {
    expect(() => priceTrip(rule, [], extras)).toThrow(RangeError);
  });

  it('always gives totals equal to the sum of their lines, in whole pence', () => {
    for (let i = 1; i <= 500; i++) {
      const varied: PriceRule = {
        baseFarePence: (i * 37) % 900,
        perMilePence: (i * 53) % 400,
        minimumFarePence: 1500,
        nightSurchargePercent: (i * 7) % 60,
        airportFeePence: (i * 11) % 700,
        discountPercent: (i * 13) % 40,
      };
      const leg = (offset: number): Leg => ({
        distanceMiles: ((i + offset) * 0.37) % 80 || 0.1,
        // Every hour of the day, and an airport on every third leg.
        pickupAt: new Date(Date.UTC(2026, 0, 15, (i + offset) % 24, 0)),
        airport: (i + offset) % 3 === 0,
        airportPickup: (i + offset) % 3 === 0,
        meetGreet: (i + offset) % 6 === 0,
      });
      const trip = priceTrip(varied, [leg(0), leg(5)], extras);

      for (const priced of trip.legs) {
        expect(priced.totalPence).toBe(added(priced));
        expect(Number.isInteger(priced.totalPence)).toBe(true);
        expect(priced.originalPence).toBeGreaterThanOrEqual(1500);
        expect(priced.farePence).toBeLessThanOrEqual(priced.originalPence);
      }
      expect(trip.totalPence).toBe(trip.legs.reduce((sum, l) => sum + added(l), 0));
    }
  });
});

describe('fits and recommend', () => {
  // The seeded Saloon and Executive, in list order after the 8 Seater is left out.
  const saloon = { name: 'Saloon', passengers: 4, suitcases: 3, handLuggage: 4 };
  const executive = { name: 'Executive', passengers: 3, suitcases: 4, handLuggage: 3 };
  const eightSeater = { name: '8 Seater', passengers: 8, suitcases: 8, handLuggage: 8 };

  it('needs a seat for every passenger and room for every suitcase', () => {
    expect(fits(saloon, { passengers: 4, suitcases: 3, handLuggage: 4 })).toBe(true);
    expect(fits(saloon, { passengers: 5, suitcases: 0, handLuggage: 0 })).toBe(false);
    expect(fits(saloon, { passengers: 1, suitcases: 4, handLuggage: 0 })).toBe(false);
  });

  it('lets hand bags use suitcase room the party does not need', () => {
    // 1 suitcase leaves room for 2 more bags, so 6 hand bags fit where 4 are listed.
    expect(fits(saloon, { passengers: 2, suitcases: 1, handLuggage: 6 })).toBe(true);
    expect(fits(saloon, { passengers: 2, suitcases: 1, handLuggage: 7 })).toBe(false);
    // But a suitcase never goes in hand-bag room.
    expect(fits(saloon, { passengers: 2, suitcases: 4, handLuggage: 0 })).toBe(false);
  });

  it('recommends the first class in list order that fits', () => {
    const classes = [executive, saloon, eightSeater];

    expect(recommend(classes, { passengers: 2, suitcases: 2, handLuggage: 2 })?.name).toBe(
      'Executive',
    );
    // Four people do not fit the Executive.
    expect(recommend(classes, { passengers: 4, suitcases: 1, handLuggage: 0 })?.name).toBe(
      'Saloon',
    );
    expect(recommend(classes, { passengers: 8, suitcases: 8, handLuggage: 8 })?.name).toBe(
      '8 Seater',
    );
  });

  it('recommends nothing when no class fits', () => {
    expect(recommend([saloon, executive], { passengers: 6, suitcases: 0, handLuggage: 0 })).toBe(
      undefined,
    );
  });
});

describe('formatPence', () => {
  it('shows pence as pounds with two decimals', () => {
    expect(formatPence(1250)).toBe('£12.50');
    expect(formatPence(5)).toBe('£0.05');
    expect(formatPence(0)).toBe('£0.00');
  });
});

describe('priceChoice', () => {
  // Two legs as a quote saved them: 10% off a £47.35 original, so £42.61 a leg.
  const saved = (): SavedLegPrice => ({
    lines: [
      { code: 'BASE_FARE', label: 'Base fare', amountPence: 350 },
      { code: 'DISTANCE', label: '18.5 miles at £2.10 a mile', amountPence: 3885 },
      { code: 'AIRPORT_FEE', label: 'Airport pick-up or drop-off', amountPence: 500 },
      { code: 'DISCOUNT', label: 'Discount: 10% off', amountPence: -474 },
    ],
    originalPence: 4735,
    discountPence: 474,
    pricePence: 4261,
  });
  const out = { airportPickup: false, meetGreet: false };
  const back = { airportPickup: true, meetGreet: true };

  it('charges exactly the saved price when nothing is added', () => {
    const { legs, totalPence } = priceChoice([saved()], [out], 1000);
    expect(totalPence).toBe(4261);
    expect(legs[0]).toMatchObject({
      originalPence: 4735,
      discountPence: 474,
      farePence: 4261,
      meetGreetPence: 0,
      totalPence: 4261,
    });
    expect(legs[0]!.lines).toEqual(saved().lines);
  });

  it('adds Meet & Greet at the quoted price, as the last line, on the leg that chose it', () => {
    const { legs, totalPence } = priceChoice([saved(), saved()], [out, back], 1000);
    expect(legs[0]!.meetGreetPence).toBe(0);
    expect(legs[1]!.meetGreetPence).toBe(1000);
    expect(legs[1]!.totalPence).toBe(5261);
    expect(legs[1]!.lines.at(-1)).toEqual(meetGreetLine(1000));
    expect(totalPence).toBe(4261 + 5261);
  });

  it('adds no line when Meet & Greet costs nothing', () => {
    const { legs } = priceChoice([saved()], [back], 0);
    expect(legs[0]!.lines).toHaveLength(4);
    expect(legs[0]!.totalPence).toBe(4261);
  });

  it('refuses Meet & Greet on a leg that does not start at an airport', () => {
    expect(() => priceChoice([saved()], [{ airportPickup: false, meetGreet: true }], 1000)).toThrow(
      RangeError,
    );
  });

  it('refuses a choice count that does not match the legs, and no legs at all', () => {
    expect(() => priceChoice([saved()], [out, out], 1000)).toThrow(RangeError);
    expect(() => priceChoice([], [], 1000)).toThrow(RangeError);
  });

  it('refuses a saved price whose lines do not add up', () => {
    const broken = saved();
    broken.pricePence = 4262;
    expect(() => priceChoice([broken], [out], 1000)).toThrow('does not add up');
    const wrongFare = { ...saved(), originalPence: 4736 };
    expect(() => priceChoice([wrongFare], [out], 1000)).toThrow('does not add up');
  });

  it('leaves the saved lines untouched', () => {
    const leg = saved();
    priceChoice([leg], [back], 1000);
    expect(leg.lines).toHaveLength(4);
  });
});
