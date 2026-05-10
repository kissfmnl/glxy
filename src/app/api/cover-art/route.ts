import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** iTunes Search API — artwork voor artiest+titel (geen API-key). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist")?.trim() ?? "";
  const title = searchParams.get("title")?.trim() ?? "";
  const q = [artist, title].filter(Boolean).join(" ").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ url: "" });
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&limit=1&entity=song`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store", headers: { Accept: "application/json" } });
    clearTimeout(t);
    if (!res.ok) return NextResponse.json({ url: "" });

    const data = (await res.json()) as { results?: Array<{ artworkUrl100?: string }> };
    const raw = data.results?.[0]?.artworkUrl100;
    if (!raw) return NextResponse.json({ url: "" });

    const hi = raw.replace(/100x100bb/, "600x600bb");
    return NextResponse.json({ url: hi }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ url: "" });
  }
}
