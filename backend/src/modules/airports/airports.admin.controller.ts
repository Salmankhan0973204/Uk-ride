import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { CreateAirportInput, UpdateAirportInput } from './airports.schemas.js';
import { createAirport, listAllAirports, updateAirport } from './airports.service.js';

/** Every airport, including the ones that are switched off. */
export const listAll: RequestHandler = async (_req, res) => {
  const airports = await listAllAirports();

  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: 'All airports',
    data: { airports },
    meta: { count: airports.length },
  });
};

/** Adds an airport. */
export const create: RequestHandler = async (req, res) => {
  const airport = await createAirport(req.body as CreateAirportInput);

  sendSuccess(res, { status: 201, message: 'Airport added', data: { airport } });
};

/** Changes an airport, or switches it off or on with `isActive`. */
export const update: RequestHandler<{ id: string }> = async (req, res) => {
  const airport = await updateAirport(req.params.id, req.body as UpdateAirportInput);

  sendSuccess(res, { message: 'Airport updated', data: { airport } });
};
