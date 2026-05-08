CREATE TABLE "studio_bookings" (
  "id" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "title" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'CUSTOM',
  "notes" TEXT,
  "bookedByName" TEXT NOT NULL,
  "bookedByUserId" TEXT,
  "recurrenceGroupId" TEXT,
  "isCancelled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "studio_bookings_startAt_idx" ON "studio_bookings"("startAt");
CREATE INDEX "studio_bookings_endAt_idx" ON "studio_bookings"("endAt");
CREATE INDEX "studio_bookings_isCancelled_startAt_idx" ON "studio_bookings"("isCancelled","startAt");
CREATE INDEX "studio_bookings_recurrenceGroupId_idx" ON "studio_bookings"("recurrenceGroupId");
