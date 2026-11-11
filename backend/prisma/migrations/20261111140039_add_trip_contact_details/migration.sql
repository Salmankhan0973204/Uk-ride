/*
  Warnings:

  - Added the required column `contact_email` to the `trips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_first_name` to the `trips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_last_name` to the `trips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_mobile` to the `trips` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "contact_email" TEXT NOT NULL,
ADD COLUMN     "contact_first_name" TEXT NOT NULL,
ADD COLUMN     "contact_last_name" TEXT NOT NULL,
ADD COLUMN     "contact_mobile" TEXT NOT NULL;
