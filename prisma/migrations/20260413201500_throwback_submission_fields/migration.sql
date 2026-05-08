ALTER TABLE "throwback_submissions"
ADD COLUMN "contactName" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "audioMessagePath" TEXT,
ADD COLUMN "videoMessagePath" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

UPDATE "throwback_submissions"
SET
  "contactName" = "companyName",
  "email" = '',
  "phone" = ''
WHERE "contactName" IS NULL OR "email" IS NULL OR "phone" IS NULL;

ALTER TABLE "throwback_submissions"
ALTER COLUMN "contactName" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

CREATE INDEX "throwback_submissions_status_idx" ON "throwback_submissions"("status");
