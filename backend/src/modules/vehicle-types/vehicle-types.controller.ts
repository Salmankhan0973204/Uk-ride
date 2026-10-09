import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import { getVehicleType, listVehicleTypes } from './vehicle-types.service.js';

/** Every vehicle type on offer. */
export const list: RequestHandler = async (_req, res) => {
  const vehicleTypes = await listVehicleTypes();

  sendSuccess(res, {
    message: 'Vehicle types',
    data: { vehicleTypes },
    meta: { count: vehicleTypes.length },
  });
};

/** One vehicle type, named by the slug in the address. */
export const detail: RequestHandler<{ slug: string }> = async (req, res) => {
  const vehicleType = await getVehicleType(req.params.slug.toLowerCase());

  sendSuccess(res, { message: 'Vehicle type', data: { vehicleType } });
};
