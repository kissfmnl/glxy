-- AlterTable
ALTER TABLE "home_hero_headline_slots"
ADD COLUMN "startTime" TEXT,
ADD COLUMN "endTime" TEXT;

-- CreateTable
CREATE TABLE "schedule_temporary_slots" (
  "id" TEXT NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsOn" DATE NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "label" TEXT,
  "notes" TEXT,
  "coHostName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "jockId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "schedule_temporary_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_temporary_slots_isActive_startsOn_endsOn_dayOfWeek_idx"
ON "schedule_temporary_slots"("isActive", "startsOn", "endsOn", "dayOfWeek");

-- CreateIndex
CREATE INDEX "schedule_temporary_slots_jockId_idx"
ON "schedule_temporary_slots"("jockId");

-- AddForeignKey
ALTER TABLE "schedule_temporary_slots"
ADD CONSTRAINT "schedule_temporary_slots_jockId_fkey"
FOREIGN KEY ("jockId") REFERENCES "jocks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
