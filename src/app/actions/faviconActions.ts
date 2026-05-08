"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeUnderWebsite } from "@/lib/websiteDisk";

const FAVICON_KEY = "SITE_FAVICON_PATH";
const DEFAULT_FAVICON = "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png";

function assertAdmin(session: unknown) {
  if (!session || ((session as { user?: { role?: string } }).user?.role !== "ADMIN")) {
    throw new Error("Niet geautoriseerd");
  }
}

async function saveFaviconUpload(file: File | null) {
  if (!file || file.size === 0) return null;
  const ext = path.extname(file.name || "").toLowerCase() || ".png";
  const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg", ".ico"].includes(ext) ? ext : ".png";
  const fileName = `favicon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", "favicon", fileName], bytes);
}

export async function getFaviconSettings() {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const row = await prisma.siteSetting.findUnique({ where: { key: FAVICON_KEY }, select: { value: true } });
  return {
    currentPath: row?.value?.trim() || null,
    defaultPath: DEFAULT_FAVICON,
  };
}

export async function uploadSiteFavicon(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const rel = await saveFaviconUpload((formData.get("file") as File | null) || null);
  if (!rel) return { success: false as const, error: "Geen bestand." };
  await prisma.siteSetting.upsert({
    where: { key: FAVICON_KEY },
    create: { key: FAVICON_KEY, value: rel },
    update: { value: rel },
  });
  revalidatePath("/");
  revalidatePath("/settings/favicon");
  revalidatePath("/settings/site");
  return { success: true as const };
}

export async function resetSiteFaviconToDefault() {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  await prisma.siteSetting.deleteMany({ where: { key: FAVICON_KEY } });
  revalidatePath("/");
  revalidatePath("/settings/favicon");
  revalidatePath("/settings/site");
  return { success: true as const };
}
