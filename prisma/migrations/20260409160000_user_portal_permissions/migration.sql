-- Add per-user portal permission storage.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "permissionsJson" TEXT NOT NULL DEFAULT '[]';
