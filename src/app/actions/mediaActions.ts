"use server";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { inlineApiMediaUrlIfLocal } from "@/lib/inlineMediaFromApiUrl";
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

/** Als de browser geen type meestuurt (sommige OS/browsers), afleiden uit extensie. */
const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

async function requireAdmin(): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Geen rechten." };
  }
  return { ok: true };
}

function resolveImageMime(file: { type?: string; name?: string }): string | null {
  const fromType = file.type?.trim?.();
  if (fromType && MIME_EXT[fromType]) return fromType;
  const ext = path.extname(file.name || "").toLowerCase();
  const guessed = EXT_TO_MIME[ext];
  return guessed ?? null;
}

function isFileLike(v: unknown): v is Blob & { name?: string } {
  return !!v && typeof v === "object" && typeof (v as Blob).arrayBuffer === "function" && typeof (v as Blob).size === "number";
}

export async function uploadMediaAssetAction(
  formData: FormData,
): Promise<{ ok?: true; url?: string; id?: string; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const raw = formData.get("file");
    if (!isFileLike(raw) || raw.size === 0) {
      return { error: "Kies een bestand." };
    }
    const file = raw;
    if (file.size > MAX_BYTES) {
      return { error: "Bestand te groot (max. 10 MB)." };
    }
    const mimeType = resolveImageMime(file);
    const ext = mimeType ? MIME_EXT[mimeType] : null;
    if (!mimeType || !ext) {
      return { error: "Alleen afbeeldingen (jpg, png, gif, webp, svg)." };
    }

    let buf: Buffer;
    try {
      buf = Buffer.from(await file.arrayBuffer());
    } catch {
      return { error: "Bestand kon niet worden gelezen." };
    }

    const filename = typeof file.name === "string" && file.name.trim() ? file.name : "upload";
    const safeName = filename.replace(/[^\w.\-()\s]/g, "_").slice(0, 80);
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

    let row;
    try {
      row = await prisma.mediaAsset.create({
        data: {
          filename: filename || base,
          storagePath,
          mimeType,
          sizeBytes: buf.length,
        },
      });
    } catch (e) {
      try {
        const abs = absoluteWebsitePath(storagePath);
        await fs.unlink(abs).catch(() => {});
      } catch {
        /* ignore */
      }
      console.error("[uploadMediaAssetAction]", e);
      return {
        error:
          "Opslaan in de database mislukt. Voer lokaal/server `npx prisma db push` uit zodat het model MediaAsset bestaat.",
      };
    }

    const url = publicMediaUrlFromStoragePath(storagePath);
    revalidatePath("/admin/media");
    revalidatePath("/admin/branding");
    return { ok: true, url, id: row.id };
  } catch (e) {
    console.error("[uploadMediaAssetAction] unexpected", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg ? `Upload serverfout: ${msg}` : "Upload mislukt door een serverfout." };
  }
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
  const auth = await requireAdmin();
  if ("error" in auth) throw new Error(auth.error);
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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) return { error: "Niet gevonden." };

  try {
    const abs = absoluteWebsitePath(row.storagePath);
    await fs.unlink(abs).catch(() => {});
  } catch {
    /* bestand weg — DB nog opruimen */
  }

  try {
    await prisma.mediaAsset.delete({ where: { id } });
  } catch (e) {
    console.error("[deleteMediaAssetAction]", e);
    return { error: "Verwijderen mislukt." };
  }
  revalidatePath("/admin/media");
  return { ok: true };
}

/** Zet logo of favicon in branding naar een bestaand MediaAsset. */
export async function applyMediaToBrandingAction(
  mediaId: string,
  field: "logo" | "favicon",
): Promise<{ ok?: true; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const row = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!row) return { error: "Media niet gevonden." };
  const url = publicMediaUrlFromStoragePath(row.storagePath);
  if (!url) return { error: "Ongeldig mediapad." };

  try {
    const logoDataUri =
      field === "logo" ? await inlineApiMediaUrlIfLocal(url) : null;
    const inlinedLogo =
      logoDataUri?.startsWith("data:image/") ? logoDataUri : null;

    await prisma.branding.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...(field === "logo"
          ? inlinedLogo
            ? { logoDataUri: inlinedLogo, logoUrl: null }
            : { logoUrl: url }
          : {}),
        ...(field === "favicon" ? { faviconUrl: url } : {}),
      },
      update:
        field === "logo"
          ? inlinedLogo
            ? { logoDataUri: inlinedLogo, logoUrl: null }
            : { logoUrl: url, logoDataUri: null }
          : { faviconUrl: url },
    });
  } catch (e) {
    console.error("[applyMediaToBrandingAction]", e);
    return { error: "Branding bijwerken mislukt." };
  }

  revalidatePath("/");
  revalidatePath("/admin/branding");
  return { ok: true };
}
