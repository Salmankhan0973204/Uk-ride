import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import { listAllVehicleTypes } from './vehicle-types.service.js';

/** Every vehicle type, including the ones that are switched off. */
export const listAll: RequestHandler = async (_req, res) => {
  const vehicleTypes = await listAllVehicleTypes();

  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: 'All vehicle types',
    data: { vehicleTypes },
    meta: { count: vehicleTypes.length },
  });
};
