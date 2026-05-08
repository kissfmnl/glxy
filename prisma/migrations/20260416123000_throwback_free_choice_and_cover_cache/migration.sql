-- CreateTable
CREATE TABLE "album_cover_cache" (
    "key" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_cover_cache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "album_cover_cache_updatedAt_idx" ON "album_cover_cache"("updatedAt" DESC);

-- CreateTable
CREATE TABLE "throwback_submission_custom_songs" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "throwback_submission_custom_songs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "throwback_submission_custom_songs_submissionId_idx" ON "throwback_submission_custom_songs"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "throwback_submission_custom_songs_submissionId_rank_key" ON "throwback_submission_custom_songs"("submissionId", "rank");

-- AddForeignKey
ALTER TABLE "throwback_submission_custom_songs" ADD CONSTRAINT "throwback_submission_custom_songs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "throwback_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

