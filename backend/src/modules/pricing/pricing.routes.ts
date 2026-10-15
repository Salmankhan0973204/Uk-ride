import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { list, set } from './pricing.controller.js';
import { pricingRuleSchema } from './pricing.schemas.js';

export const adminPricingRouter = Router();

adminPricingRouter.use(requireAuth, requireRole('ADMIN'));

adminPricingRouter.get('/', list);
// PUT, not POST or PATCH: the body is the whole rule, and sending the same
// body twice leaves the same result. The address names the vehicle type,
// because a rule belongs to exactly one.
adminPricingRouter.put('/:vehicleTypeId', validate(pricingRuleSchema), set);
