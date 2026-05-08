import { NextResponse } from "next/server";
import { readWebsiteFile } from "@/lib/websiteDisk";

function guessMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export async function GET(
  _req: Request,
  context: { params: { path: string[] } },
) {
  const segments = context.params.path ?? [];
  const joined = segments.map((s) => decodeURIComponent(s)).join("/");
  if (!joined || joined.includes("..") || joined.startsWith("/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rel = `Website/media/${joined}`;
  const file = await readWebsiteFile(rel);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const mime = guessMime(joined);
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
