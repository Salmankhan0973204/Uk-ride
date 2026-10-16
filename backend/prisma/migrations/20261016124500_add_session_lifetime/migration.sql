-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "lifetime_hours" INTEGER NOT NULL DEFAULT 168;
