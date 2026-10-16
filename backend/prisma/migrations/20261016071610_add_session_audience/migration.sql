-- CreateEnum
CREATE TYPE "SessionAudience" AS ENUM ('CUSTOMER', 'STAFF');

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "audience" "SessionAudience" NOT NULL DEFAULT 'CUSTOMER';
