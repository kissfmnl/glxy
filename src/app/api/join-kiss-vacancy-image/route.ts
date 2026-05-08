import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { JOIN_KISS_SLOTS, type JoinKissSlot } from "@/lib/joinKissDefaults";
import { readWebsiteFile } from "@/lib/websiteDisk";

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function normalizeSlot(raw: string | null): JoinKissSlot | null {
  const u = (raw || "").trim().toUpperCase();
  return (JOIN_KISS_SLOTS as readonly string[]).includes(u) ? (u as JoinKissSlot) : null;
}

export const dynamic = "force-dynamic";

/**
 * Vacature-afbeeldingen voor /join-kiss: zelfde patroon als /api/frequenties-image
 * (korte URL, geen lange encoded paden in de browser — betrouwbaarder op mobiel).
 */
export async function GET(req: NextRequest) {
  const fromQuery = (req.nextUrl.searchParams.get("path") || "").trim();
  const slot = normalizeSlot(req.nextUrl.searchParams.get("slot"));
  let imagePath = fromQuery;

  if (!imagePath && slot) {
    try {
      const row = await prisma.joinKissVacancy.findUnique({
        where: { slot },
        select: { imagePath: true, isActive: true },
      });
      if (row?.isActive) {
        imagePath = row.imagePath?.trim() || "";
      }
    } catch {
      imagePath = "";
    }
  }

  if (!imagePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const relNorm = imagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const withWebsite = relNorm.startsWith("Website/") ? relNorm : `Website/${relNorm}`;
  const found = await readWebsiteFile(withWebsite);
  if (!found) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(found.data), {
    headers: {
      "Content-Type": contentTypeFor(found.abs),
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
