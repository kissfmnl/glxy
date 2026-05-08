import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { readWebsiteFile } from "@/lib/websiteDisk";
import {
  FREQUENTIES_APP_STORE_BADGE_PATH_KEY,
  FREQUENTIES_PLAY_STORE_BADGE_PATH_KEY,
  FREQUENTIES_COVERAGE_MAP_PATH_KEY,
} from "@/lib/frequentiesBadgeKeys";

const KEYS = {
  ios: FREQUENTIES_APP_STORE_BADGE_PATH_KEY,
  android: FREQUENTIES_PLAY_STORE_BADGE_PATH_KEY,
  map: FREQUENTIES_COVERAGE_MAP_PATH_KEY,
} as const;

/** Standaardbestanden in repo onder `Website/` (ook op productie aanwezig houden). */
const DEFAULT_PATHS: Record<keyof typeof KEYS, string> = {
  ios: path.posix.join("Website", "Appstore.png"),
  android: path.posix.join("Website", "Playstore.png"),
  map: path.posix.join("Website", "KISS FM - Frequentiegebied ronde hoeken.png"),
};

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export const dynamic = "force-dynamic";

/**
 * Afbeeldingen voor /frequenties: eerst optioneel pad uit DB (admin-upload),
 * anders vaste bestanden in Website/. Geen externe proxy nodig.
 */
export async function GET(req: NextRequest) {
  const slot = req.nextUrl.searchParams.get("slot");
  if (slot !== "ios" && slot !== "android" && slot !== "map") {
    return new NextResponse("Bad request", { status: 400 });
  }

  let dbPath: string | null = null;
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: KEYS[slot] },
      select: { value: true },
    });
    dbPath = row?.value?.trim() || null;
  } catch {
    dbPath = null;
  }

  const candidates: string[] = [];
  if (dbPath) candidates.push(dbPath);
  const fallback = DEFAULT_PATHS[slot];
  if (!dbPath || dbPath.replace(/\\/g, "/") !== fallback) {
    candidates.push(fallback);
  }

  for (const rel of candidates) {
    const found = await readWebsiteFile(rel);
    if (!found) continue;
    return new NextResponse(new Uint8Array(found.data), {
      headers: {
        "Content-Type": contentTypeFor(found.abs),
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}
