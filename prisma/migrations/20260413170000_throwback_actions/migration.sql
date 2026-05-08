CREATE TABLE "throwback_songs" (
  "id" TEXT NOT NULL,
  "artist" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "year" INTEGER,
  "coverUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "throwback_songs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "throwback_submissions" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "teamPhotoPath" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "throwback_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "throwback_submission_songs" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "songId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "throwback_submission_songs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "throwback_songs_isActive_sortOrder_idx" ON "throwback_songs"("isActive", "sortOrder");
CREATE INDEX "throwback_songs_artist_title_idx" ON "throwback_songs"("artist", "title");
CREATE INDEX "throwback_submissions_createdAt_idx" ON "throwback_submissions"("createdAt" DESC);
CREATE INDEX "throwback_submission_songs_songId_idx" ON "throwback_submission_songs"("songId");
CREATE UNIQUE INDEX "throwback_submission_songs_submissionId_rank_key" ON "throwback_submission_songs"("submissionId", "rank");

ALTER TABLE "throwback_submission_songs"
ADD CONSTRAINT "throwback_submission_songs_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "throwback_submissions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "throwback_submission_songs"
ADD CONSTRAINT "throwback_submission_songs_songId_fkey"
FOREIGN KEY ("songId") REFERENCES "throwback_songs"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
