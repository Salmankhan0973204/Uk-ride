import { describe, expect, it } from 'vitest';
import { calculateQuote, formatPence } from './quote.calculator.js';
import type { PriceRule, Quote } from './quote.calculator.js';

// Example prices for the tests: £3.50 to start, £2.10 a mile, £12.00 at least.
const rule: PriceRule = { baseFarePence: 350, perMilePence: 210, minimumFarePence: 1200 };

const amounts = (quote: Quote) =>
  Object.fromEntries(quote.lines.map((line) => [line.code, line.amountPence]));

describe('calculateQuote', () => {
  it('adds the base fare and the distance', () => {
    const quote = calculateQuote(rule, { distanceMiles: 10 });

    expect(amounts(quote)).toEqual({ BASE_FARE: 350, DISTANCE: 2100 });
    expect(quote.totalPence).toBe(2450);
  });

  it('counts the distance to the nearest tenth of a mile', () => {
    expect(calculateQuote(rule, { distanceMiles: 12.44 }).chargedMiles).toBe(12.4);
    expect(calculateQuote(rule, { distanceMiles: 12.45 }).chargedMiles).toBe(12.5);
    // 12.44 miles is charged as 12.4: 124 tenths × 210p / 10 = 2604p.
    expect(amounts(calculateQuote(rule, { distanceMiles: 12.44 })).DISTANCE).toBe(2604);
  });

  it('rounds the distance charge to the nearest penny, once', () => {
    // 11 tenths × 333p / 10 = 366.3p, which is 366p.
    const quote = calculateQuote({ ...rule, perMilePence: 333 }, { distanceMiles: 1.1 });
    expect(amounts(quote).DISTANCE).toBe(366);

    // 11 tenths × 335p / 10 = 368.5p, which rounds up to 369p. Rounding down
    // would give 368p, and the test above would not notice.
    const halfway = calculateQuote({ ...rule, perMilePence: 335 }, { distanceMiles: 1.1 });
    expect(amounts(halfway).DISTANCE).toBe(369);
  });

  it('tops a short trip up to the minimum fare, on a line of its own', () => {
    // £3.50 + 2 miles at £2.10 = £7.70, below the £12.00 minimum.
    const quote = calculateQuote(rule, { distanceMiles: 2 });

    expect(amounts(quote)).toEqual({ BASE_FARE: 350, DISTANCE: 420, MINIMUM_FARE_TOP_UP: 430 });
    expect(quote.totalPence).toBe(1200);
  });

  it('adds no top-up when the fare is exactly the minimum', () => {
    // £3.50 + 4 miles at £2.10 = £11.90, and the minimum is set to exactly £11.90.
    const exact = calculateQuote({ ...rule, minimumFarePence: 1190 }, { distanceMiles: 4 });

    expect(exact.lines.map((line) => line.code)).toEqual(['BASE_FARE', 'DISTANCE']);
    expect(exact.totalPence).toBe(1190);
  });

  it('works with a free base fare or free miles', () => {
    const noBase = calculateQuote({ ...rule, baseFarePence: 0 }, { distanceMiles: 10 });
    expect(noBase.totalPence).toBe(2100);

    const flatRate = calculateQuote({ ...rule, perMilePence: 0 }, { distanceMiles: 10 });
    expect(flatRate.totalPence).toBe(1200);
  });

  it('always gives a total equal to the sum of its lines', () => {
    for (let i = 1; i <= 500; i++) {
      const quote = calculateQuote(
        { baseFarePence: (i * 37) % 900, perMilePence: (i * 53) % 400, minimumFarePence: 1500 },
        { distanceMiles: (i * 0.37) % 80 || 0.1 },
      );
      const added = quote.lines.reduce((total, line) => total + line.amountPence, 0);

      expect(quote.totalPence).toBe(added);
      expect(Number.isInteger(quote.totalPence)).toBe(true);
      expect(quote.totalPence).toBeGreaterThanOrEqual(1500);
    }
  });

  it('describes each line in words', () => {
    const quote = calculateQuote(rule, { distanceMiles: 1 });

    expect(quote.lines.map((line) => line.label)).toEqual([
      'Base fare',
      '1 mile at £2.10 a mile',
      'Minimum fare is £12.00',
    ]);
  });

  it('refuses a distance that is not a positive number up to 1000 miles', () => {
    for (const distanceMiles of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, 1000.1]) {
      expect(() => calculateQuote(rule, { distanceMiles })).toThrow(RangeError);
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
