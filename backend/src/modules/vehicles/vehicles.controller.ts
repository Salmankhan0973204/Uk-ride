import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { CreateVehicleInput, UpdateVehicleInput } from './vehicles.schemas.js';
import { createVehicle, getVehicle, updateVehicle } from './vehicles.service.js';

type ById = { id: string };

/** One vehicle. */
export const getOne: RequestHandler<ById> = async (req, res) => {
  const vehicle = await getVehicle(req.params.id);
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Vehicle', data: { vehicle } });
};

/** Adds a vehicle: 201 and where to find it. */
export const create: RequestHandler = async (req, res) => {
  const vehicle = await createVehicle(req.body as CreateVehicleInput);
  res.location(`/api/v1/admin/vehicles/${vehicle.id}`);
  sendSuccess(res, { status: 201, message: 'Vehicle added', data: { vehicle } });
};

/** Changes a vehicle. */
export const update: RequestHandler<ById> = async (req, res) => {
  const vehicle = await updateVehicle(req.params.id, req.body as UpdateVehicleInput);
  sendSuccess(res, { message: 'Vehicle updated', data: { vehicle } });
};
