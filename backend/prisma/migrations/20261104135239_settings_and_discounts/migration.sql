-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "discount_percent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "meet_greet_pence" INTEGER NOT NULL DEFAULT 1000,
    "booking_lead_minutes" INTEGER NOT NULL DEFAULT 240,
    "edit_cutoff_minutes" INTEGER NOT NULL DEFAULT 240,
    "unpaid_expiry_minutes" INTEGER NOT NULL DEFAULT 30,
    "driver_details_minutes" INTEGER NOT NULL DEFAULT 60,
    "quote_valid_minutes" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
