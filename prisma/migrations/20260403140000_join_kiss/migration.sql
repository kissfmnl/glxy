-- CreateTable
CREATE TABLE "join_kiss_vacancies" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "jobType" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "requirements" TEXT NOT NULL DEFAULT '',
    "applyLabel" TEXT NOT NULL DEFAULT 'Solliciteer',
    "applyUrl" TEXT NOT NULL DEFAULT 'mailto:info@kissfm.nl',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_kiss_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_kiss_benefits" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_kiss_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "join_kiss_vacancies_slot_key" ON "join_kiss_vacancies"("slot");

-- CreateIndex
CREATE INDEX "join_kiss_benefits_sortOrder_idx" ON "join_kiss_benefits"("sortOrder");
