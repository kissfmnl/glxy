"use server";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { publicMediaUrlFromStoragePath } from "@/lib/mediaPublicUrl";
import { prisma } from "@/lib/prisma";
import { absoluteWebsitePath } from "@/lib/websitePaths";
import { writeUnderWebsite } from "@/lib/websiteDisk";

const MAX_BYTES = 10 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Geen rechten.");
  }
}

export async function uploadMediaAssetAction(
  formData: FormData,
): Promise<{ ok?: true; url?: string; id?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies een bestand." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Bestand te groot (max. 10 MB)." };
  }
  const mimeType = file.type || "application/octet-stream";
  const ext = MIME_EXT[mimeType];
  if (!ext) {
    return { error: "Alleen afbeeldingen (jpg, png, gif, webp, svg)." };
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(await file.arrayBuffer());
  } catch {
    return { error: "Bestand kon niet worden gelezen." };
  }

  const safeName = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 80);
  const base = `${randomUUID()}-${safeName || "upload"}${ext}`;
  let storagePath: string;
  try {
    storagePath = await writeUnderWebsite(["media", base], buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("WEBSITE_FILES_ROOT")) {
      return {
        error:
          "Upload geblokkeerd: zet WEBSITE_FILES_ROOT op een persistent pad of ALLOW_EPHEMERAL_WEBSITE_FILES=1 op Railway (zie RAILWAY.md).",
      };
    }
    return { error: msg || "Schrijven mislukt." };
  }

  const row = await prisma.mediaAsset.create({
    data: {
      filename: file.name || base,
      storagePath,
      mimeType,
      sizeBytes: buf.length,
    },
  });

  const url = publicMediaUrlFromStoragePath(storagePath);
  revalidatePath("/admin/media");
  revalidatePath("/admin/branding");
  return { ok: true, url, id: row.id };
}

export async function listMediaAssetsAction(): Promise<
  Array<{
    id: string;
    filename: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
    publicUrl: string;
  }>
> {
  await requireAdmin();
  const rows = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map((r) => ({
    ...r,
    publicUrl: publicMediaUrlFromStoragePath(r.storagePath),
  }));
}

export async function deleteMediaAssetAction(id: string): Promise<{ ok?: true; error?: string }> {
  await requireAdmin();
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) return { error: "Niet gevonden." };

  try {
    const abs = absoluteWebsitePath(row.storagePath);
    await fs.unlink(abs).catch(() => {});
  } catch {
    /* bestand weg — DB nog opruimen */
  }

  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/admin/media");
  return { ok: true };
}

/** Zet logo of favicon in branding naar een bestaand MediaAsset. */
export async function applyMediaToBrandingAction(
  mediaId: string,
  field: "logo" | "favicon",
): Promise<{ ok?: true; error?: string }> {
  await requireAdmin();
  const row = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!row) return { error: "Media niet gevonden." };
  const url = publicMediaUrlFromStoragePath(row.storagePath);
  if (!url) return { error: "Ongeldig mediapad." };

  const homeHlsUrl = "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8";
  await prisma.branding.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      primaryHex: "#0b7557",
      accentHex: "#6d6d6d",
      navyHex: "#363636",
      yellowHex: "#ffe200",
      logoUrl: field === "logo" ? url : null,
      faviconUrl: field === "favicon" ? url : null,
      homeHlsUrl,
    },
    update:
      field === "logo" ? { logoUrl: url } : { faviconUrl: url },
  });

  revalidatePath("/");
  revalidatePath("/admin/branding");
  return { ok: true };
}
