-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "vehicle_type_id" TEXT NOT NULL,
    "base_fare_pence" INTEGER NOT NULL,
    "per_mile_pence" INTEGER NOT NULL,
    "minimum_fare_pence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_rules_vehicle_type_id_key" ON "pricing_rules"("vehicle_type_id");

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
