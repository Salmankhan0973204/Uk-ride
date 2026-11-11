-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ACCEPTED', 'ON_ROUTE', 'ARRIVED', 'ON_BOARD', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateEnum
CREATE TYPE "LegDirection" AS ENUM ('OUTBOUND', 'RETURN');

-- CreateEnum
CREATE TYPE "BookingEventType" AS ENUM ('CREATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingActor" AS ENUM ('CUSTOMER', 'STAFF', 'DRIVER', 'SYSTEM');

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "direction" "LegDirection" NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "BookingPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "pickup_at" TIMESTAMP(3) NOT NULL,
    "places" JSONB NOT NULL,
    "distance_miles" DOUBLE PRECISION NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "flight_number" TEXT,
    "meet_greet" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "vehicle_type_id" TEXT NOT NULL,
    "vehicle_type_snapshot" JSONB NOT NULL,
    "passengers" INTEGER NOT NULL,
    "suitcases" INTEGER NOT NULL,
    "hand_luggage" INTEGER NOT NULL,
    "lines" JSONB NOT NULL,
    "discount_percent" INTEGER NOT NULL,
    "original_pence" INTEGER NOT NULL,
    "discount_pence" INTEGER NOT NULL,
    "fare_pence" INTEGER NOT NULL,
    "meet_greet_pence" INTEGER NOT NULL,
    "total_pence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_events" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "type" "BookingEventType" NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "payment_status" "BookingPaymentStatus" NOT NULL,
    "actor" "BookingActor" NOT NULL,
    "actor_user_id" TEXT,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trips_quote_id_key" ON "trips"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");

-- CreateIndex
CREATE INDEX "bookings_user_id_pickup_at_idx" ON "bookings"("user_id", "pickup_at");

-- CreateIndex
CREATE INDEX "bookings_vehicle_type_id_idx" ON "bookings"("vehicle_type_id");

-- CreateIndex
CREATE INDEX "bookings_status_expires_at_idx" ON "bookings"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_trip_id_direction_key" ON "bookings"("trip_id", "direction");

-- CreateIndex
CREATE INDEX "booking_events_booking_id_created_at_idx" ON "booking_events"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "booking_events_actor_user_id_idx" ON "booking_events"("actor_user_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
