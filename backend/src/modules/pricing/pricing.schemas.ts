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
  },
  'Send baseFarePence, perMilePence and minimumFarePence',
);

export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
