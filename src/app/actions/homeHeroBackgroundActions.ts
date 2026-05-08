"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeUnderWebsite } from "@/lib/websiteDisk";
import { parseHomeHeroBgPaths } from "@/lib/homePageWaveCopy";

const KEY = "HOME_HERO_BG_PATHS";

function assertAdmin(session: any) {
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}

function assertWebsitePath(p: string) {
  const n = p.replace(/\\/g, "/").trim();
  if (!n.startsWith("Website/")) throw new Error("Ongeldig pad.");
  if (n.includes("..")) throw new Error("Ongeldig pad.");
}

async function readPaths(): Promise<string[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
  return parseHomeHeroBgPaths(row?.value);
}

async function writePaths(paths: string[]) {
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(paths) },
    update: { value: JSON.stringify(paths) },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/settings/homepage");
  revalidatePath("/settings/homepage-wave");
  revalidatePath("/settings/homepage-collage");
  revalidatePath("/settings/website-teksten");
}

async function saveUpload(file: File | null) {
  if (!file || file.size === 0) return null;
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".avif"].includes(ext) ? ext : ".jpg";
  const fileName = `home-hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", "home-hero", fileName], bytes);
}

export async function uploadHomeHeroBackground(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const file = (formData.get("file") as File | null) || null;
  const rel = await saveUpload(file);
  if (!rel) return { success: false as const, error: "Geen bestand." };
  const paths = await readPaths();
  paths.push(rel);
  await writePaths(paths);
  return { success: true as const };
}

export async function removeHomeHeroBackground(pathToRemove: string) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  assertWebsitePath(pathToRemove);
  const paths = (await readPaths()).filter((p) => p !== pathToRemove);
  await writePaths(paths);
  return { success: true as const };
}
