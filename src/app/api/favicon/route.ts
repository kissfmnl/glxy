import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { readWebsiteFile } from "@/lib/websiteDisk";

const FAVICON_KEY = "SITE_FAVICON_PATH";
const DEFAULT_FAVICON = "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png";

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

export const dynamic = "force-dynamic";

export async function GET() {
  let dbPath: string | null = null;
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: FAVICON_KEY }, select: { value: true } });
    dbPath = row?.value?.trim() || null;
  } catch {
    dbPath = null;
  }

  const candidates = [dbPath, DEFAULT_FAVICON].filter((v, i, a): v is string => !!v && a.indexOf(v) === i);
  for (const rel of candidates) {
    const found = await readWebsiteFile(rel);
    if (!found) continue;
    return new NextResponse(new Uint8Array(found.data), {
      headers: {
        "Content-Type": contentTypeFor(found.abs),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  return new NextResponse("Not found", { status: 404 });
}
