CREATE TABLE "visit_events" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "ipHash" TEXT,
  "country" TEXT,
  "city" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "visit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visit_events_createdAt_idx" ON "visit_events"("createdAt" DESC);
CREATE INDEX "visit_events_path_idx" ON "visit_events"("path");
CREATE INDEX "visit_events_country_idx" ON "visit_events"("country");
