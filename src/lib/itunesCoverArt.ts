/** iTunes Search API — artwork-URL voor artiest + titel (geen API-key). */

export async function fetchItunesCoverUrl(artist: string, title: string): Promise<string> {
  const q = [artist, title].map((s) => s.trim()).filter(Boolean).join(" ").trim();
  if (!q || q.length < 2) return "";

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&limit=1&entity=song`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store", headers: { Accept: "application/json" } });
    clearTimeout(t);
    if (!res.ok) return "";

    const data = (await res.json()) as { results?: Array<{ artworkUrl100?: string }> };
    const raw = data.results?.[0]?.artworkUrl100;
    if (!raw) return "";

    return raw.replace(/100x100bb/, "600x600bb");
  } catch {
    return "";
  }
}
