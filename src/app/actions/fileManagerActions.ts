"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getWebsiteWriteRoot } from "@/lib/websiteDisk";

function assertAdmin(session: unknown) {
  if (!session || ((session as { user?: { role?: string } }).user?.role !== "ADMIN")) {
    throw new Error("Niet geautoriseerd");
  }
}

const BASE = path.join(getWebsiteWriteRoot(), "Website");

function normRel(rel: string) {
  return rel.replace(/\\/g, "/").replace(/^\/+/, "");
}

function absFor(rel: string) {
  const n = normRel(rel);
  const abs = path.join(BASE, ...n.split("/").filter(Boolean));
  const normalized = path.normalize(abs);
  if (!normalized.startsWith(BASE + path.sep) && normalized !== BASE) throw new Error("Ongeldig pad");
  return normalized;
}

async function walk(dir: string, out: string[]) {
  const rows = await fs.readdir(dir, { withFileTypes: true });
  for (const r of rows) {
    const p = path.join(dir, r.name);
    if (r.isDirectory()) await walk(p, out);
    else out.push(path.relative(BASE, p).replace(/\\/g, "/"));
  }
}

export async function listWebsiteFiles(): Promise<string[]> {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const out: string[] = [];
  await fs.mkdir(BASE, { recursive: true });
  await walk(BASE, out);
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export async function getWebsiteFileUsageMap(): Promise<Record<string, { used: boolean; contexts: string[] }>> {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const files = await listWebsiteFiles();
  const result: Record<string, { used: boolean; contexts: string[] }> = Object.fromEntries(
    files.map((f) => [f, { used: false, contexts: [] as string[] }])
  );

  const [jocks, slots, tempSlots, concerts, vacancies, settings] = await Promise.all([
    prisma.jock.findMany({ select: { imagePath: true, profileImagePath: true } }),
    prisma.scheduleSlot.findMany({ select: { programImagePath: true } }),
    prisma.scheduleTemporarySlot.findMany({ select: { programImagePath: true } }),
    prisma.concert.findMany({ select: { imagePath: true } }),
    prisma.joinKissVacancy.findMany({ select: { imagePath: true } }),
    prisma.siteSetting.findMany({ select: { value: true } }),
  ]);

  const mark = (rel: string | null | undefined, context: string) => {
    if (!rel) return;
    const n = normRel(rel.replace(/^Website\//, ""));
    if (!result[n]) return;
    result[n].used = true;
    if (!result[n].contexts.includes(context)) result[n].contexts.push(context);
  };

  jocks.forEach((r) => {
    mark(r.imagePath, "DJ foto");
    mark(r.profileImagePath, "DJ profielfoto");
  });
  slots.forEach((r) => mark(r.programImagePath, "Programmering"));
  tempSlots.forEach((r) => mark(r.programImagePath, "Tijdelijke programmering"));
  concerts.forEach((r) => mark(r.imagePath, "Concerten"));
  vacancies.forEach((r) => mark(r.imagePath, "Vacatures"));

  for (const f of files) {
    const full = `Website/${f}`;
    if (settings.some((s) => (s.value || "").includes(full))) {
      result[f].used = true;
      if (!result[f].contexts.includes("Site instellingen")) result[f].contexts.push("Site instellingen");
    }
  }

  return result;
}

async function hasReferences(relPath: string): Promise<boolean> {
  const rel = normRel(relPath);
  const pref = `Website/${rel}`;
  const [j, s, t, c, cnt] = await Promise.all([
    prisma.jock.count({ where: { OR: [{ imagePath: pref }, { profileImagePath: pref }] } }),
    prisma.scheduleSlot.count({ where: { OR: [{ programImagePath: pref }, { jock: { imagePath: pref } }] } }),
    prisma.scheduleTemporarySlot.count({ where: { OR: [{ programImagePath: pref }, { jock: { imagePath: pref } }] } }),
    prisma.concert.count({ where: { imagePath: pref } }),
    prisma.siteSetting.count({ where: { value: { contains: pref } } }),
  ]);
  const vac = await prisma.joinKissVacancy.count({ where: { imagePath: pref } });
  return j + s + t + c + cnt + vac > 0;
}

export async function deleteWebsiteFile(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const rel = String(formData.get("file") || "");
  if (await hasReferences(rel)) throw new Error("Bestand wordt nog gebruikt in instellingen/data.");
  await fs.unlink(absFor(rel));
  revalidatePath("/settings/bestanden");
  return { success: true as const };
}

export async function uploadWebsiteFile(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const folder = normRel(String(formData.get("folder") || "uploads/files"));
  console.log("[file-manager][upload] action start", { folder });
  const rawEntries = [...formData.getAll("files"), formData.get("file")];
  const rawFileMeta = rawEntries
    .filter((f): f is File => f instanceof File)
    .map((f) => ({ name: f.name, type: f.type, size: f.size }));
  console.log("[file-manager][upload] raw file entries", rawFileMeta);
  const fileEntries = rawEntries.filter((f): f is File => f instanceof File);
  if (fileEntries.length === 0) throw new Error("Geen bestand gekozen.");
  const emptyFiles = fileEntries.filter((f) => f.size === 0);
  if (emptyFiles.length > 0) {
    throw new Error(`Bestand '${emptyFiles[0].name || "(onbekend)"}' is leeg of kon niet gelezen worden.`);
  }
  const inputFiles = fileEntries;
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  for (const file of inputFiles) {
    console.log("[file-manager][upload] incoming", JSON.stringify({ folder, name: file.name, type: file.type, size: file.size }));
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`Bestand '${file.name}' is te groot (${Math.round(file.size / (1024 * 1024))}MB). Max is 10MB.`);
    }
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._\- ]/g, "_");
    const rel = `${folder}/${Date.now()}-${safeName}`.replace(/^\/+/, "");
    const abs = absFor(rel);
    console.log("[file-manager][upload] target", JSON.stringify({ rel }));
    try {
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, Buffer.from(await file.arrayBuffer()));
      console.log("[file-manager][upload] saved", rel);
    } catch (e: any) {
      console.error("[file-manager][upload] failed", {
        folder,
        name: file.name,
        type: file.type,
        size: file.size,
        rel,
        message: String(e?.message || e),
      });
      throw new Error(`Upload mislukt voor '${file.name}': ${String(e?.message || e)}`);
    }
  }
  revalidatePath("/settings/bestanden");
  return { success: true as const, uploaded: inputFiles.length };
}

export async function renameWebsiteFile(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const oldRel = String(formData.get("oldFile") || "");
  const newName = path.basename(String(formData.get("newName") || "").trim());
  if (!newName) throw new Error("Nieuwe naam ontbreekt.");
  if (await hasReferences(oldRel)) {
    throw new Error("Bestand wordt nog gebruikt. Hernoemen geblokkeerd om breuken te voorkomen.");
  }
  const oldAbs = absFor(oldRel);
  const newRel = path.join(path.dirname(normRel(oldRel)), newName).replace(/\\/g, "/");
  const newAbs = absFor(newRel);
  await fs.rename(oldAbs, newAbs);
  revalidatePath("/settings/bestanden");
  return { success: true as const };
}
