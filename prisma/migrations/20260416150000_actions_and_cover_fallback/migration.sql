-- CreateTable
CREATE TABLE "album_cover_negative_cache" (
    "key" TEXT NOT NULL,
    "reason" TEXT,
    "httpStatus" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_cover_negative_cache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "album_cover_negative_cache_updatedAt_idx" ON "album_cover_negative_cache"("updatedAt" DESC);

-- CreateTable
CREATE TABLE "public_actions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "statusLabel" TEXT,
    "body" TEXT,
    "ctaLabel" TEXT,
    "href" TEXT NOT NULL,
    "imagePath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "public_actions_slug_key" ON "public_actions"("slug");

-- CreateIndex
CREATE INDEX "public_actions_isActive_sortOrder_idx" ON "public_actions"("isActive", "sortOrder");

