import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { CreateVehicleTypeInput, UpdateVehicleTypeInput } from './vehicle-types.schemas.js';
import {
  createVehicleType,
  deactivateVehicleType,
  listAllVehicleTypes,
  updateVehicleType,
} from './vehicle-types.service.js';

type ById = { id: string };

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

/** Adds a vehicle type. 201 and a Location header: something new now exists. */
export const create: RequestHandler = async (req, res) => {
  const vehicleType = await createVehicleType(req.body as CreateVehicleTypeInput);

  res.location(`/api/v1/vehicle-types/${vehicleType.slug}`);
  sendSuccess(res, { status: 201, message: 'Vehicle type created', data: { vehicleType } });
};

/** Changes a vehicle type. */
export const update: RequestHandler<ById> = async (req, res) => {
  const vehicleType = await updateVehicleType(req.params.id, req.body as UpdateVehicleTypeInput);

  sendSuccess(res, { message: 'Vehicle type updated', data: { vehicleType } });
};

/** Switches a vehicle type off. The row is kept. */
export const deactivate: RequestHandler<ById> = async (req, res) => {
  const vehicleType = await deactivateVehicleType(req.params.id);

  sendSuccess(res, { message: 'Vehicle type switched off', data: { vehicleType } });
};
