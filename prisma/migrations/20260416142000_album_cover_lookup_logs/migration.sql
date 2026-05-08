-- CreateTable
CREATE TABLE "album_cover_lookup_logs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "queryUrl" TEXT,
    "httpStatus" INTEGER,
    "resultsCount" INTEGER,
    "coverUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_cover_lookup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "album_cover_lookup_logs_createdAt_idx" ON "album_cover_lookup_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "album_cover_lookup_logs_key_idx" ON "album_cover_lookup_logs"("key");

