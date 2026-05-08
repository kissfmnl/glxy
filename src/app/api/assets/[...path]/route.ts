import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readWebsiteFile, websiteFileReadCandidates } from "@/lib/websiteDisk";

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const requested = params.path.join("/");
  if (!websiteFileReadCandidates(requested).length) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const found = await readWebsiteFile(requested);
  if (!found) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(found.data), {
    headers: {
      "Content-Type": contentTypeFor(found.abs),
      // Korte browser-cache zodat handmatige vervanging van een bestand sneller zichtbaar wordt.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

