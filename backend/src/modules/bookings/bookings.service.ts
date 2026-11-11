import { prisma } from '../../config/db.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import { fits, priceChoice } from '../quotes/quote.calculator.js';
import type { SavedQuote } from '../quotes/quote.saved.js';
import { bookableUntil, findBookableQuote } from '../quotes/quotes.service.js';
import { getSettings } from '../settings/settings.service.js';
import { newReference } from './booking.reference.js';
import { toPublicTrip, tripSelect } from './bookings.select.js';
import type { BookingInput } from './bookings.schemas.js';

/** Who is booking. A guest (6.3) proves a mobile with a code instead of signing in. */
export interface Booker {
  userId: string;
}

/**
 * Why a quote could not be booked as sent. Every one is a 409 with this in
 * `details.reason`; the page asks for a new quote and shows the new price
 * before the customer books again.
 */
export type StaleReason = 'QUOTE_EXPIRED' | 'QUOTE_USED' | 'PRICE_CHANGED' | 'CLASS_UNAVAILABLE';

const stale = (reason: StaleReason, message: string, details?: Record<string, unknown>) =>
  AppError.conflict(message, { reason, ...details });

const isPrismaError = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

/** How often a booking is tried before giving up on a clash. */
const ATTEMPTS = 3;

/**
 * Books a saved quote: one journey, or two for a return, each PENDING and
 * UNPAID with its own reference, held until it is paid or its time runs out.
 *
 * The quote is the contract. The price comes from the quote row alone, never
 * from the request, the current prices or the map; the only figure the
 * request carries, the total the page showed, is compared and never charged.
 */
export async function bookQuote(input: BookingInput, booker: Booker) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await tryBook(input, booker);
    } catch (err) {
      // A reference drawn twice, or a trip made a moment ago by another
      // request for the same quote: the transaction was rolled back. Look
      // again; the second case then finds the trip and answers for it.
      if (isPrismaError(err, 'P2002') && attempt < ATTEMPTS) continue;
      throw err;
    }
  }
}

async function tryBook(input: BookingInput, booker: Booker) {
  // The clock is read once, here.
  const now = new Date();
  const settings = await getSettings();

  // Booked already? The same person sending the same request again (a lost
  // answer, a double click) gets the same trip back while it is still held.
  // Anyone else, a changed request or a trip no longer held: a new quote.
  const booked = await prisma.booking.findMany({
    where: { trip: { quoteId: input.quoteId } },
    orderBy: { pickupAt: 'asc' },
    select: bookedSelect,
  });
  if (booked.length > 0) {
    if (!isSameRequest(booked, input, booker, now)) {
      throw stale(
        'QUOTE_USED',
        'These prices have already been booked. Get a new quote to book again',
      );
    }
    const trip = await prisma.trip.findUniqueOrThrow({
      where: { id: booked[0]!.tripId },
      select: tripSelect,
    });
    return { trip: toPublicTrip(trip), replayed: true };
  }

  const quote = await findBookableQuote(input.quoteId, now, settings.bookingLeadMinutes);
  if (!quote) throw stale('QUOTE_EXPIRED', 'These prices have run out. Get a new quote');

  const { option, choices } = checkChoices(input, quote);

  // The class as it is now: still on offer, still priced, still big enough.
  // The list on screen is stale otherwise, so the page asks for a new quote.
  const type = await prisma.vehicleType.findFirst({
    where: { id: option.vehicleType.id, isActive: true, pricingRule: { isNot: null } },
    select: { id: true, passengers: true, suitcases: true, handLuggage: true },
  });
  if (!type || !fits(type, quote.journey.party)) {
    throw stale(
      'CLASS_UNAVAILABLE',
      'This car is no longer available for this journey. Choose another car',
    );
  }

  const price = priceChoice(option.legs, choices, quote.meetGreetPence);
  if (price.totalPence !== input.expectedTotalPence) {
    throw stale('PRICE_CHANGED', 'The price has changed. Check the new price, then book again', {
      expectedTotalPence: input.expectedTotalPence,
      totalPence: price.totalPence,
    });
  }

  // Held for the grace period, or less when the pick-up comes within the
  // booking lead time. Both journeys of a trip share it.
  const outbound = quote.journey.legs[0]!;
  const expiresAt = bookableUntil(
    new Date(now.getTime() + settings.unpaidExpiryMinutes * 60_000),
    outbound.pickupAt,
    settings.bookingLeadMinutes,
  );
  const { vehicleType, discountPercent } = option;
  const { party } = quote.journey;

  // Who the journeys are for: the profile as it is now, copied onto the trip.
  const contact = await prisma.user.findUniqueOrThrow({
    where: { id: booker.userId },
    select: { firstName: true, lastName: true, email: true, mobile: true },
  });

  // The trip, its journeys and their first events, in one statement: either
  // everything is written or nothing is.
  const trip = await prisma.trip.create({
    data: {
      quoteId: quote.id,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      contactEmail: contact.email,
      contactMobile: contact.mobile,
      bookings: {
        create: quote.journey.legs.map(
          (leg, index): Prisma.BookingUncheckedCreateWithoutTripInput => ({
            reference: newReference(),
            direction: leg.direction,
            userId: booker.userId,
            expiresAt,
            pickupAt: leg.pickupAt,
            places: leg.places as unknown as Prisma.InputJsonValue,
            distanceMiles: leg.distanceMiles,
            durationMinutes: leg.durationMinutes,
            flightNumber: choices[index]!.flightNumber ?? null,
            meetGreet: choices[index]!.meetGreet,
            notes: input.notes ?? null,
            vehicleTypeId: type.id,
            vehicleTypeSnapshot: {
              slug: vehicleType.slug,
              name: vehicleType.name,
              exampleModels: vehicleType.exampleModels,
              passengers: vehicleType.passengers,
              suitcases: vehicleType.suitcases,
              handLuggage: vehicleType.handLuggage,
            },
            passengers: party.passengers,
            suitcases: party.suitcases,
            handLuggage: party.handLuggage,
            lines: price.legs[index]!.lines as unknown as Prisma.InputJsonValue,
            discountPercent,
            originalPence: price.legs[index]!.originalPence,
            discountPence: price.legs[index]!.discountPence,
            farePence: price.legs[index]!.farePence,
            meetGreetPence: price.legs[index]!.meetGreetPence,
            totalPence: price.legs[index]!.totalPence,
            events: {
              create: {
                type: 'CREATED',
                status: 'PENDING',
                paymentStatus: 'UNPAID',
                actor: 'CUSTOMER',
                actorUserId: booker.userId,
                data: { via: 'SIGNED_IN' },
              },
            },
          }),
        ),
      },
    },
    select: tripSelect,
  });

  return { trip: toPublicTrip(trip), replayed: false };
}

/** What a booking already made from a quote is compared with a repeated request on. */
const bookedSelect = {
  tripId: true,
  userId: true,
  status: true,
  paymentStatus: true,
  expiresAt: true,
  vehicleTypeId: true,
  flightNumber: true,
  meetGreet: true,
  notes: true,
  totalPence: true,
} satisfies Prisma.BookingSelect;

type BookedLeg = Prisma.BookingGetPayload<{ select: typeof bookedSelect }>;

/**
 * Whether a request repeats the booking already made from its quote: the
 * same customer, the same car, choices, notes and total, and the trip still
 * held. A lost answer is then answered again. A changed request is not,
 * because the customer would be shown a booking they did not ask for.
 */
function isSameRequest(booked: BookedLeg[], input: BookingInput, booker: Booker, now: Date) {
  const [outbound, back] = booked;
  const sameChoices = (leg: BookedLeg, flightNumber: string | undefined, meetGreet: boolean) =>
    leg.flightNumber === (flightNumber ?? null) && leg.meetGreet === meetGreet;

  return (
    booked.every(
      (leg) =>
        leg.userId === booker.userId &&
        leg.status === 'PENDING' &&
        leg.paymentStatus === 'UNPAID' &&
        leg.expiresAt > now &&
        leg.vehicleTypeId === input.vehicleTypeId &&
        leg.notes === (input.notes ?? null),
    ) &&
    sameChoices(outbound!, input.outboundFlightNumber, input.outboundMeetGreet) &&
    (back
      ? sameChoices(back, input.returnFlightNumber, input.returnMeetGreet)
      : input.returnFlightNumber === undefined && !input.returnMeetGreet) &&
    booked.reduce((total, leg) => total + leg.totalPence, 0) === input.expectedTotalPence
  );
}

/** What the customer chose for one leg, checked against the leg. */
interface Choice {
  airportPickup: boolean;
  meetGreet: boolean;
  flightNumber: string | undefined;
}

/**
 * Checks the car and the per-leg choices against the quote. Every problem is
 * reported at once, on its own field, before any price is touched: Meet &
 * Greet away from an airport pick-up would make the engine fail loudly.
 */
function checkChoices(input: BookingInput, quote: SavedQuote) {
  const problems: Record<string, string[]> = {};
  const problem = (field: string, message: string) => (problems[field] ??= []).push(message);

  const option = quote.options.find(
    (candidate) => candidate.vehicleType.id === input.vehicleTypeId,
  );
  if (!option) {
    problem('vehicleTypeId', 'Choose one of the cars in your quote');
  } else if (!option.fits) {
    problem(
      'vehicleTypeId',
      'This car is too small for your passengers and luggage. Choose another car',
    );
  }

  const [outbound, back] = quote.journey.legs;
  const chosen = [
    {
      leg: outbound!,
      field: 'outbound',
      flightNumber: input.outboundFlightNumber,
      meetGreet: input.outboundMeetGreet,
    },
  ];
  if (back) {
    chosen.push({
      leg: back,
      field: 'return',
      flightNumber: input.returnFlightNumber,
      meetGreet: input.returnMeetGreet,
    });
  } else {
    if (input.returnFlightNumber !== undefined) {
      problem('returnFlightNumber', 'This journey has no return');
    }
    if (input.returnMeetGreet) problem('returnMeetGreet', 'This journey has no return');
  }

  const choices = chosen.map(({ leg, field, flightNumber, meetGreet }): Choice => {
    const airportPickup = leg.airportPickup !== null;
    if (airportPickup && flightNumber === undefined) {
      problem(
        `${field}FlightNumber`,
        'Enter the flight number, so your driver can follow the landing time',
      );
    }
    if (!airportPickup && flightNumber !== undefined) {
      problem(`${field}FlightNumber`, 'Only a pick-up at an airport needs a flight number');
    }
    if (!airportPickup && meetGreet) {
      problem(`${field}MeetGreet`, 'Meet & Greet is only for a pick-up at an airport');
    }
    return { airportPickup, meetGreet, flightNumber };
  });

  if (Object.keys(problems).length > 0) throw AppError.validation(problems);
  return { option: option!, choices };
}
