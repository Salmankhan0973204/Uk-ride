-- Existing refresh tokens have no session id and cannot be given one.
-- They are removed; everyone signs in again.
DELETE FROM "refresh_tokens";

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "session_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");

