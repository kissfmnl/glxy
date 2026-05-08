import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/** Zelfde-origin proxy: mobiele browsers / WebViews blokkeren vaak hotlinken naar Apple/Google. */
const UPSTREAM: Record<string, string> = {
  apple:
    "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/nl-nl?size=250x83",
  google: "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png",
};

async function tryPublicFallback(kind: string): Promise<Buffer | null> {
  try {
    const p = path.join(process.cwd(), "public", "store-badges", `${kind === "apple" ? "app-store" : "google-play"}.png`);
    return await readFile(p);
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: { kind: string } }) {
  const kind = params.kind?.toLowerCase();
  const url = kind ? UPSTREAM[kind] : undefined;
  if (!url) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "image/*,*/*",
        "User-Agent":
          "Mozilla/5.0 (compatible; KISS-FM/1.0; +https://kissfm.nl) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const ab = await res.arrayBuffer();
      const ct = res.headers.get("content-type") || (kind === "apple" ? "image/svg+xml" : "image/png");
      return new NextResponse(ab, {
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "Content-Disposition": "inline",
        },
      });
    }
  } catch {
    /* fallback */
  }

  const fallback = await tryPublicFallback(kind);
  if (fallback) {
    return new NextResponse(new Uint8Array(fallback), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  }

  return new NextResponse("Badge tijdelijk niet beschikbaar", { status: 502 });
}
