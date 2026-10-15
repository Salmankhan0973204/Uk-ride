/** One vehicle type's prices. Every amount is whole pence. */
export interface PricingRule {
  baseFarePence: number;
  perMilePence: number;
  minimumFarePence: number;
  /** 25 means 25%. */
  nightSurchargePercent: number;
  airportFeePence: number;
  updatedAt: string;
}

/** A vehicle type with its prices, or null where none are set. */
export interface VehicleTypePricing {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  pricingRule: PricingRule | null;
}

/** Body of PUT /api/v1/admin/pricing/:vehicleTypeId: the whole rule. */
export type PricingRuleInput = Omit<PricingRule, 'updatedAt'>;
