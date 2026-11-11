import type { Prisma } from '../../generated/prisma/client.js';
import { publicVehicleType } from '../vehicle-types/vehicle-types.select.js';

/**
 * What a customer sees of a booked journey. No row ids of other tables, no
 * user: the reference is the name a journey goes by.
 */
export const bookingSelect = {
  reference: true,
  direction: true,
  status: true,
  paymentStatus: true,
  expiresAt: true,
  pickupAt: true,
  places: true,
  distanceMiles: true,
  durationMinutes: true,
  flightNumber: true,
  meetGreet: true,
  notes: true,
  vehicleType: { select: publicVehicleType },
  passengers: true,
  suitcases: true,
  handLuggage: true,
  lines: true,
  discountPercent: true,
  originalPence: true,
  discountPence: true,
  farePence: true,
  meetGreetPence: true,
  totalPence: true,
  createdAt: true,
} satisfies Prisma.BookingSelect;

/** A trip with its journeys, outbound first. */
export const tripSelect = {
  id: true,
  createdAt: true,
  contactFirstName: true,
  contactLastName: true,
  contactEmail: true,
  contactMobile: true,
  bookings: { orderBy: { pickupAt: 'asc' }, select: bookingSelect },
} satisfies Prisma.TripSelect;

export type TripRow = Prisma.TripGetPayload<{ select: typeof tripSelect }>;

/**
 * The trip as the API answers it: each journey with its party and its price
 * grouped, and the total of them all, which is never stored.
 */
export function toPublicTrip(trip: TripRow) {
  const bookings = trip.bookings.map(
    ({
      passengers,
      suitcases,
      handLuggage,
      lines,
      discountPercent,
      originalPence,
      discountPence,
      farePence,
      meetGreetPence,
      totalPence,
      ...journey
    }) => ({
      ...journey,
      party: { passengers, suitcases, handLuggage },
      price: {
        lines,
        discountPercent,
        originalPence,
        discountPence,
        farePence,
        meetGreetPence,
        totalPence,
      },
    }),
  );

  return {
    id: trip.id,
    createdAt: trip.createdAt,
    // Who the journeys are for, as given when booking.
    contact: {
      firstName: trip.contactFirstName,
      lastName: trip.contactLastName,
      email: trip.contactEmail,
      mobile: trip.contactMobile,
    },
    currency: 'GBP' as const,
    totalPence: bookings.reduce((total, booking) => total + booking.price.totalPence, 0),
    // The journeys of a trip share one hold, so the earliest is the trip's.
    expiresAt: bookings.reduce(
      (earliest, booking) => (booking.expiresAt < earliest ? booking.expiresAt : earliest),
      bookings[0]!.expiresAt,
    ),
    bookings,
  };
}

export type PublicTrip = ReturnType<typeof toPublicTrip>;
