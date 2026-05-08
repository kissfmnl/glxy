-- AlterTable
ALTER TABLE "concerts"
ADD COLUMN "source" TEXT,
ADD COLUMN "externalKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "concerts_externalKey_key" ON "concerts"("externalKey");
