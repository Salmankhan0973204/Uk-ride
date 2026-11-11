import type { RequestHandler } from 'express';
import { logger } from '../../config/logger.js';
import { currentUserId } from '../../middleware/requireAuth.js';
import { sendSuccess } from '../../shared/response.js';
import type { BookingInput } from './bookings.schemas.js';
import { bookQuote } from './bookings.service.js';

/** Books a saved quote for the signed-in customer. */
export const book: RequestHandler = async (req, res) => {
  const { trip, replayed } = await bookQuote(req.body as BookingInput, {
    userId: currentUserId(res),
  });

  // What was booked, never who: no names, notes or contact details in the log.
  (req.log ?? logger).info(
    {
      tripId: trip.id,
      references: trip.bookings.map((booking) => booking.reference),
      totalPence: trip.totalPence,
      replayed,
    },
    replayed ? 'Trip booked already; answered again' : 'Trip booked',
  );

  // A booking is one customer's: no copy is kept anywhere on the way.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    status: replayed ? 200 : 201,
    message: replayed ? 'Already booked' : 'Booked',
    data: { trip },
  });
};
