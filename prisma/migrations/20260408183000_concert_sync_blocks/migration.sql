CREATE TABLE "concert_sync_blocks" (
  "externalKey" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'ticketmaster',
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "concert_sync_blocks_pkey" PRIMARY KEY ("externalKey")
);
