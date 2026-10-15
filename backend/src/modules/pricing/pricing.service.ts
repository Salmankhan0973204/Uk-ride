import { prisma } from '../../config/db.js';
import { AppError } from '../../shared/AppError.js';
import type { PricingRuleInput } from './pricing.schemas.js';

export const pricingRuleSelect = {
  baseFarePence: true,
  perMilePence: true,
  minimumFarePence: true,
  updatedAt: true,
} as const;

/**
 * Every vehicle type with its prices, in list order. A type with no rule
 * yet comes back with `pricingRule: null`, so an admin can see what is
 * still missing. Switched-off types are included: prices can be prepared
 * before a type goes on offer.
 */
export function listPricing() {
  return prisma.vehicleType.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      pricingRule: { select: pricingRuleSelect },
    },
  });
}

/**
 * Sets the prices of one vehicle type: creates the rule the first time,
 * replaces it after that. `upsert` does both in one statement, so two admins
 * saving at the same moment cannot create two rules.
 */
export async function setPricing(vehicleTypeId: string, input: PricingRuleInput) {
  const type = await prisma.vehicleType.findUnique({
    where: { id: vehicleTypeId },
    select: { id: true, slug: true, name: true, isActive: true },
  });
  if (!type) throw AppError.notFound('There is no such vehicle type');

  const pricingRule = await prisma.pricingRule.upsert({
    where: { vehicleTypeId },
    create: { vehicleTypeId, ...input },
    update: input,
    select: pricingRuleSelect,
  });

  return { ...type, pricingRule };
}
