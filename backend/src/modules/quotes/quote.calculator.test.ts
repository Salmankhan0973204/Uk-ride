import { describe, expect, it } from 'vitest';
import { calculateQuote, formatPence, isNight, ukHour } from './quote.calculator.js';
import type { PriceRule, Quote } from './quote.calculator.js';

// Example prices for the tests: £3.50 to start, £2.10 a mile, £12.00 at least.
// No surcharges here; the surcharge tests below switch them on.
const rule: PriceRule = {
  baseFarePence: 350,
  perMilePence: 210,
  minimumFarePence: 1200,
  nightSurchargePercent: 0,
  airportFeePence: 0,
};

// Midday, not to or from an airport: no surcharge can apply.
const day = { pickupAt: new Date('2026-03-10T12:00:00Z'), airport: false };

const amounts = (quote: Quote) =>
  Object.fromEntries(quote.lines.map((line) => [line.code, line.amountPence]));

describe('calculateQuote', () => {
  it('adds the base fare and the distance', () => {
    const quote = calculateQuote(rule, { ...day, distanceMiles: 10 });

    expect(amounts(quote)).toEqual({ BASE_FARE: 350, DISTANCE: 2100 });
    expect(quote.totalPence).toBe(2450);
  });

  it('counts the distance to the nearest tenth of a mile', () => {
    expect(calculateQuote(rule, { ...day, distanceMiles: 12.44 }).chargedMiles).toBe(12.4);
    expect(calculateQuote(rule, { ...day, distanceMiles: 12.45 }).chargedMiles).toBe(12.5);
    // 12.44 miles is charged as 12.4: 124 tenths × 210p / 10 = 2604p.
    expect(amounts(calculateQuote(rule, { ...day, distanceMiles: 12.44 })).DISTANCE).toBe(2604);
  });

  it('rounds the distance charge to the nearest penny, once', () => {
    // 11 tenths × 333p / 10 = 366.3p, which is 366p.
    const quote = calculateQuote({ ...rule, perMilePence: 333 }, { ...day, distanceMiles: 1.1 });
    expect(amounts(quote).DISTANCE).toBe(366);

    // 11 tenths × 335p / 10 = 368.5p, which rounds up to 369p. Rounding down
    // would give 368p, and the test above would not notice.
    const halfway = calculateQuote({ ...rule, perMilePence: 335 }, { ...day, distanceMiles: 1.1 });
    expect(amounts(halfway).DISTANCE).toBe(369);
  });

  it('tops a short trip up to the minimum fare, on a line of its own', () => {
    // £3.50 + 2 miles at £2.10 = £7.70, below the £12.00 minimum.
    const quote = calculateQuote(rule, { ...day, distanceMiles: 2 });

    expect(amounts(quote)).toEqual({ BASE_FARE: 350, DISTANCE: 420, MINIMUM_FARE_TOP_UP: 430 });
    expect(quote.totalPence).toBe(1200);
  });

  it('adds no top-up when the fare is exactly the minimum', () => {
    // £3.50 + 4 miles at £2.10 = £11.90, and the minimum is set to exactly £11.90.
    const exact = calculateQuote({ ...rule, minimumFarePence: 1190 }, { ...day, distanceMiles: 4 });

    expect(exact.lines.map((line) => line.code)).toEqual(['BASE_FARE', 'DISTANCE']);
    expect(exact.totalPence).toBe(1190);
  });

  it('works with a free base fare or free miles', () => {
    const noBase = calculateQuote({ ...rule, baseFarePence: 0 }, { ...day, distanceMiles: 10 });
    expect(noBase.totalPence).toBe(2100);

    const flatRate = calculateQuote({ ...rule, perMilePence: 0 }, { ...day, distanceMiles: 10 });
    expect(flatRate.totalPence).toBe(1200);
  });

  it('always gives a total equal to the sum of its lines', () => {
    for (let i = 1; i <= 500; i++) {
      const quote = calculateQuote(
        {
          baseFarePence: (i * 37) % 900,
          perMilePence: (i * 53) % 400,
          minimumFarePence: 1500,
          nightSurchargePercent: (i * 7) % 60,
          airportFeePence: (i * 11) % 700,
        },
        {
          distanceMiles: (i * 0.37) % 80 || 0.1,
          // Every hour of the day, and an airport on every third trip.
          pickupAt: new Date(Date.UTC(2026, 0, 15, i % 24, 0)),
          airport: i % 3 === 0,
        },
      );
      const added = quote.lines.reduce((total, line) => total + line.amountPence, 0);

      expect(quote.totalPence).toBe(added);
      expect(Number.isInteger(quote.totalPence)).toBe(true);
      expect(quote.totalPence).toBeGreaterThanOrEqual(1500);
    }
  });

  it('describes each line in words', () => {
    const quote = calculateQuote(rule, { ...day, distanceMiles: 1 });

    expect(quote.lines.map((line) => line.label)).toEqual([
      'Base fare',
      '1 mile at £2.10 a mile',
      'Minimum fare is £12.00',
    ]);
  });

  it('refuses a distance that is not a positive number up to 1000 miles', () => {
    for (const distanceMiles of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, 1000.1]) {
      expect(() => calculateQuote(rule, { ...day, distanceMiles })).toThrow(RangeError);
    }
  });
});

describe('formatPence', () => {
  it('shows pence as pounds with two decimals', () => {
    expect(formatPence(1250)).toBe('£12.50');
    expect(formatPence(5)).toBe('£0.05');
    expect(formatPence(0)).toBe('£0.00');
  });
});

describe('surcharges', () => {
  // 25% at night, £5.00 for an airport.
  const withSurcharges: PriceRule = { ...rule, nightSurchargePercent: 25, airportFeePence: 500 };
  // In winter the UK is on GMT, so UK time equals UTC.
  const winterNight = new Date('2026-01-15T23:00:00Z');

  it('adds the night surcharge as a share of the fare', () => {
    // £3.50 + 10 miles at £2.10 = £24.50; 25% of that is £6.125, so 613p.
    const quote = calculateQuote(withSurcharges, {
      distanceMiles: 10,
      pickupAt: winterNight,
      airport: false,
    });

    expect(quote.night).toBe(true);
    expect(amounts(quote)).toEqual({ BASE_FARE: 350, DISTANCE: 2100, NIGHT_SURCHARGE: 613 });
    expect(quote.totalPence).toBe(3063);
  });

  it('works out the night surcharge after the minimum fare', () => {
    // 2 miles is topped up to £12.00 first; 25% of £12.00 is £3.00.
    const quote = calculateQuote(withSurcharges, {
      distanceMiles: 2,
      pickupAt: winterNight,
      airport: false,
    });

    expect(amounts(quote).NIGHT_SURCHARGE).toBe(300);
    expect(quote.totalPence).toBe(1500);
  });

  it('adds the airport fee last, without the night surcharge on it', () => {
    const quote = calculateQuote(withSurcharges, {
      distanceMiles: 10,
      pickupAt: winterNight,
      airport: true,
    });

    expect(quote.lines.map((line) => line.code)).toEqual([
      'BASE_FARE',
      'DISTANCE',
      'NIGHT_SURCHARGE',
      'AIRPORT_FEE',
    ]);
    // 2450 + 613 + 500. A surcharge on the fee too would make it 3688.
    expect(quote.totalPence).toBe(3563);
  });

  it('adds the airport fee by day as well', () => {
    const quote = calculateQuote(withSurcharges, { ...day, distanceMiles: 10, airport: true });
    expect(amounts(quote)).toEqual({ BASE_FARE: 350, DISTANCE: 2100, AIRPORT_FEE: 500 });
  });

  it('adds no lines for surcharges set to 0', () => {
    const quote = calculateQuote(rule, { distanceMiles: 10, pickupAt: winterNight, airport: true });

    expect(quote.night).toBe(true);
    expect(quote.lines.map((line) => line.code)).toEqual(['BASE_FARE', 'DISTANCE']);
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

  it('refuses a pick-up time that is not a date', () => {
    expect(() =>
      calculateQuote(rule, { distanceMiles: 5, pickupAt: new Date('not a date'), airport: false }),
    ).toThrow(RangeError);
  });
});
