"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeUnderWebsite } from "@/lib/websiteDisk";

function assertAdmin(session: unknown) {
  if (!session || ((session as { user?: { role?: string } }).user?.role !== "ADMIN")) {
    throw new Error("Niet geautoriseerd");
  }
}

function norm(v: FormDataEntryValue | null | undefined) {
  return String(v ?? "").trim();
}

function safeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function pickUpload(formData: FormData, field: string): File | null {
  const entries = formData.getAll(field).filter((v): v is File => v instanceof File);
  const f = entries.find((x) => x.size > 0) || null;
  return f;
}

async function saveActionCardImage(file: File | null) {
  if (!file || file.size === 0) return null;
  if (file.size > 8 * 1024 * 1024) throw new Error("Afbeelding is te groot. Maximaal 8MB.");
  const mime = String(file.type || "").toLowerCase();
  if (!new Set(["image/png", "image/jpeg", "image/webp"]).has(mime)) {
    throw new Error("Gebruik een JPG, PNG of WEBP bestand.");
  }
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const safeExt = ext === ".png" || ext === ".webp" ? ext : ".jpg";
  const fileName = `action-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", "acties", fileName], bytes);
}

export async function upsertPublicAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const id = norm(formData.get("id"));
  const slugRaw = norm(formData.get("slug"));
  const title = norm(formData.get("title"));
  const href = norm(formData.get("href"));
  const statusLabel = norm(formData.get("statusLabel")) || null;
  const body = norm(formData.get("body")) || null;
  const ctaLabel = norm(formData.get("ctaLabel")) || null;
  const sortOrder = Number(norm(formData.get("sortOrder")) || "0");
  const isActive = formData.get("isActive") === "on";
  const imagePathInput = norm(formData.get("imagePath")) || null;
  const uploaded = await saveActionCardImage(pickUpload(formData, "imageFile"));
  const imagePath = uploaded || imagePathInput;

  if (!title) throw new Error("Titel is verplicht.");
  if (!href) throw new Error("Link (href) is verplicht.");
  const slug = safeSlug(slugRaw || title);
  if (!slug) throw new Error("Slug is verplicht.");

  if (id) {
    await prisma.publicAction.update({
      where: { id },
      data: { slug, title, href, statusLabel, body, ctaLabel, imagePath, isActive, sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0 },
    });
  } else {
    await prisma.publicAction.create({
      data: { slug, title, href, statusLabel, body, ctaLabel, imagePath, isActive, sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0 },
    });
  }
  revalidatePath("/");
  revalidatePath("/acties");
  revalidatePath("/admin/acties");
}

export async function deletePublicAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const id = norm(formData.get("id"));
  if (!id) throw new Error("Actie ID ontbreekt.");
  await prisma.publicAction.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/acties");
  revalidatePath("/admin/acties");
}

