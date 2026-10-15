-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "airport_fee_pence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "night_surcharge_percent" INTEGER NOT NULL DEFAULT 0;
