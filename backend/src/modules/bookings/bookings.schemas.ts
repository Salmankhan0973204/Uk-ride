import { z } from 'zod';

/**
 * Body of POST /bookings: which saved quote, which car, what was chosen for
 * each leg, and the total the page showed.
 *
 * Never a price. The server charges what the quote saved and uses the total
 * only to check that the customer saw the same figure (6.2: never trust a
 * client price). The fields are flat, so every message lands on its own
 * field; a one-way journey uses the `outbound*` fields.
 */

/** "BA117", "U28466", "EZY8466", "4U9524": an airline code, up to 4 digits, maybe a letter. */
const FLIGHT_NUMBER = /^(?:[A-Z]{2,3}|[A-Z]\d|\d[A-Z])\d{1,4}[A-Z]?$/;

/** "ba 117" and "BA-117" are BA117. Empty means not given. */
const flightNumber = z
  .string('Enter a flight number like BA117')
  .transform((value, ctx) => {
    const cleaned = value.replace(/[\s-]/g, '').toUpperCase();
    if (cleaned === '') return undefined;
    if (!FLIGHT_NUMBER.test(cleaned)) {
      ctx.issues.push({
        code: 'custom',
        message: 'Enter a flight number like BA117',
        input: value,
      });
      return z.NEVER;
    }
    return cleaned;
  })
  .optional();

const meetGreet = z.boolean('Meet & Greet must be true or false').default(false);

export const bookingSchema = z.strictObject(
  {
    quoteId: z.uuid('Get a quote first'),
    vehicleTypeId: z.uuid('Choose a car'),
    // What the page showed: the car's price plus Meet & Greet where chosen.
    expectedTotalPence: z
      .number('Send the total you were shown, in pence')
      .int('Send the total you were shown, in pence')
      .min(0, 'Send the total you were shown, in pence')
      .max(99_999_999, 'Send the total you were shown, in pence'),
    // Required when the leg starts at an airport, where Meet & Greet may be added.
    outboundFlightNumber: flightNumber,
    outboundMeetGreet: meetGreet,
    // The journey back, when there is one.
    returnFlightNumber: flightNumber,
    returnMeetGreet: meetGreet,
    // For the driver. Copied to every journey of the trip.
    notes: z
      .string('Notes must be text')
      .trim()
      .max(500, 'Notes must be at most 500 characters')
      .transform((value) => (value === '' ? undefined : value))
      .optional(),
  },
  'Send quoteId, vehicleTypeId and expectedTotalPence, and optionally outboundFlightNumber, ' +
    'outboundMeetGreet, returnFlightNumber, returnMeetGreet and notes',
);

export type BookingInput = z.infer<typeof bookingSchema>;
