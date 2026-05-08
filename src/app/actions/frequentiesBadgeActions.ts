"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeUnderWebsite } from "@/lib/websiteDisk";

import {
  FREQUENTIES_APP_STORE_BADGE_PATH_KEY as IOS_KEY,
  FREQUENTIES_PLAY_STORE_BADGE_PATH_KEY as ANDROID_KEY,
  FREQUENTIES_COVERAGE_MAP_PATH_KEY as MAP_KEY,
} from "@/lib/frequentiesBadgeKeys";

function assertAdmin(session: unknown) {
  if (!session || ((session as { user?: { role?: string } }).user?.role !== "ADMIN")) {
    throw new Error("Niet geautoriseerd");
  }
}

async function saveUpload(file: File | null, prefix: "store-badge" | "coverage-map") {
  if (!file || file.size === 0) return null;
  const ext = path.extname(file.name || "").toLowerCase() || ".png";
  const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext) ? ext : ".png";
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", "frequenties", fileName], bytes);
}

async function upsertPath(key: string, value: string | null) {
  if (value === null || value === "") {
    await prisma.siteSetting.deleteMany({ where: { key } });
    return;
  }
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function uploadFrequentiesStoreBadge(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const which = (formData.get("which") as string) || "";
  const key = which === "android" ? ANDROID_KEY : IOS_KEY;
  const file = (formData.get("file") as File | null) || null;
  const rel = await saveUpload(file, "store-badge");
  if (!rel) return { success: false as const, error: "Geen bestand." };
  await upsertPath(key, rel);
  revalidatePath("/frequenties");
  revalidatePath("/settings/frequenties-badges");
  return { success: true as const };
}

export async function clearFrequentiesStoreBadge(which: "ios" | "android") {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const key = which === "android" ? ANDROID_KEY : IOS_KEY;
  await prisma.siteSetting.deleteMany({ where: { key } });
  revalidatePath("/frequenties");
  revalidatePath("/settings/frequenties-badges");
  return { success: true as const };
}

export async function uploadFrequentiesCoverageMap(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const file = (formData.get("file") as File | null) || null;
  const rel = await saveUpload(file, "coverage-map");
  if (!rel) return { success: false as const, error: "Geen bestand." };
  await upsertPath(MAP_KEY, rel);
  revalidatePath("/frequenties");
  revalidatePath("/settings/frequenties-badges");
  return { success: true as const };
}

export async function clearFrequentiesCoverageMap() {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  await prisma.siteSetting.deleteMany({ where: { key: MAP_KEY } });
  revalidatePath("/frequenties");
  revalidatePath("/settings/frequenties-badges");
  return { success: true as const };
}

export async function setFrequentiesAssetFromExisting(which: "ios" | "android" | "coverageMap", imagePath: string) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const value = String(imagePath || "").trim();
  if (!value) return { success: false as const, error: "Geen pad gekozen." };
  const key = which === "ios" ? IOS_KEY : which === "android" ? ANDROID_KEY : MAP_KEY;
  await upsertPath(key, value);
  revalidatePath("/frequenties");
  revalidatePath("/settings/frequenties-badges");
  return { success: true as const };
}

export async function getFrequentiesBadgePaths(): Promise<{
  ios: string | null;
  android: string | null;
  coverageMap: string | null;
}> {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const [iosRow, andRow, mapRow] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: IOS_KEY }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: ANDROID_KEY }, select: { value: true } }),
    prisma.siteSetting.findUnique({ where: { key: MAP_KEY }, select: { value: true } }),
  ]);
  return {
    ios: iosRow?.value?.trim() || null,
    android: andRow?.value?.trim() || null,
    coverageMap: mapRow?.value?.trim() || null,
  };
}
