-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "journey" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "meet_greet_pence" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotes_expires_at_idx" ON "quotes"("expires_at");
