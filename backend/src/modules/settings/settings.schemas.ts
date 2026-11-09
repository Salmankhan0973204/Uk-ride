import { z } from 'zod';
import { pence } from '../pricing/pricing.schemas.js';

const DAY = 24 * 60;

/** A whole number of minutes in a range, with a message that says the range. */
const minutes = (label: string, min: number, max: number) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined ? `${label} is required` : `${label} must be a number of minutes`,
    })
    .int(`${label} must be whole minutes`)
    .min(min, `${label} must be at least ${min} minutes`)
    .max(max, `${label} must be at most ${max} minutes`);

/** The whole set of settings, every time, like the prices: PUT replaces them. */
export const settingsSchema = z.strictObject(
  {
    meetGreetPence: pence('Meet & Greet', 10_000),
    bookingLeadMinutes: minutes('Booking lead time', 0, 7 * DAY),
    editCutoffMinutes: minutes('Edit cut-off', 0, 7 * DAY),
    unpaidExpiryMinutes: minutes('Unpaid expiry', 5, DAY),
    driverDetailsMinutes: minutes('Driver details', 0, DAY),
    quoteValidMinutes: minutes('Quote validity', 5, 4 * 60),
  },
  'Send meetGreetPence, bookingLeadMinutes, editCutoffMinutes, unpaidExpiryMinutes, driverDetailsMinutes and quoteValidMinutes',
);

export type SettingsInput = z.infer<typeof settingsSchema>;
