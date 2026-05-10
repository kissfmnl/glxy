import { NextResponse } from "next/server";
import { fetchItunesCoverUrl } from "@/lib/itunesCoverArt";

export const dynamic = "force-dynamic";

/** iTunes Search API — artwork voor artiest+titel (geen API-key). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist")?.trim() ?? "";
  const title = searchParams.get("title")?.trim() ?? "";

  try {
    const hi = await fetchItunesCoverUrl(artist, title);
    return NextResponse.json(
      { url: hi },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ url: "" });
  }
}
