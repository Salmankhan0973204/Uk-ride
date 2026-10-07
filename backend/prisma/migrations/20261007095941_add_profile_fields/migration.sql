-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "mobile" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

