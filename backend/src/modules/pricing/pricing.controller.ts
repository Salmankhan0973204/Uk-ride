import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { PricingRuleInput } from './pricing.schemas.js';
import { listPricing, setPricing } from './pricing.service.js';

/** Every vehicle type with its prices, or null where none are set. */
export const list: RequestHandler = async (_req, res) => {
  const vehicleTypes = await listPricing();
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: 'Pricing',
    data: { vehicleTypes },
    meta: { currency: 'GBP', unit: 'pence' },
  });
};

/** Sets the prices of one vehicle type. */
export const set: RequestHandler<{ vehicleTypeId: string }> = async (req, res) => {
  const vehicleType = await setPricing(req.params.vehicleTypeId, req.body as PricingRuleInput);
  sendSuccess(res, { message: 'Prices saved', data: { vehicleType } });
};
