import { z } from 'zod';

/**
 * An amount of money in whole pence, from 0 to `max`.
 *
 * `.int()` matters: PostgreSQL would quietly round 3.5 to 4 in a whole-number
 * column, so a decimal must be refused here, with a message, before it gets
 * that far. Pounds are converted to pence by the client, not by the API.
 */
export const pence = (label: string, max: number) =>
  z
    .number({
      // Missing and wrong are different mistakes, so they get different messages.
      error: (issue) =>
        issue.input === undefined ? `${label} is required` : `${label} must be a number of pence`,
    })
    .int(`${label} must be whole pence, like 350 for £3.50`)
    .min(0, `${label} cannot be negative`)
    .max(max, `${label} must be at most ${max} pence (£${max / 100})`);

/**
 * The whole rule, every time. PUT replaces what is there, so a field that is
 * left out is an error, not "keep the old value".
 */
export const pricingRuleSchema = z.strictObject(
  {
    baseFarePence: pence('Base fare', 100_000),
    perMilePence: pence('Price per mile', 10_000),
    minimumFarePence: pence('Minimum fare', 100_000),
    nightSurchargePercent: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? 'Night surcharge is required'
            : 'Night surcharge must be a number',
      })
      .int('Night surcharge must be a whole percentage, like 25')
      .min(0, 'Night surcharge cannot be negative')
      .max(100, 'Night surcharge must be at most 100%'),
    airportFeePence: pence('Airport fee', 10_000),
  },
  'Send baseFarePence, perMilePence, minimumFarePence, nightSurchargePercent and airportFeePence',
);

export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
