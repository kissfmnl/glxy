"use server";

import { prisma } from "@/lib/prisma";
import { trackKeyNorm } from "@/lib/trackNormalization";

const NEGATIVE_TTL_MS = 6 * 60 * 60 * 1000;

async function getAlbumCoverFromDeezer(artist: string, title: string): Promise<{ coverUrl: string | null; queryUrl: string }>{
  const q = `${artist} ${title}`.trim();
  const queryUrl = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=3`;
  try {
    const res = await fetch(queryUrl, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) return { coverUrl: null, queryUrl };
    const json: any = await res.json();
    const first = Array.isArray(json?.data) ? json.data[0] : null;
    const cover =
      String(first?.album?.cover_xl || first?.album?.cover_big || first?.album?.cover_medium || first?.album?.cover || "").trim() ||
      null;
    return { coverUrl: cover, queryUrl };
  } catch {
    return { coverUrl: null, queryUrl };
  }
}

/**
 * Zoekt een album cover via de iTunes Search API.
 * Dit is een gratis API waarvoor geen API key nodig is.
 */
export async function getAlbumCover(artist: string, title: string) {
  if (!artist || !title) return null;

  try {
    const key = trackKeyNorm(artist, title);
    const cached = await prisma.albumCoverCache.findUnique({
      where: { key },
      select: { coverUrl: true },
    });
    if (cached?.coverUrl) {
      // Log alleen cache-hits niet; debug focust op misses/itunes.
      return cached.coverUrl;
    }

    const neg = await prisma.albumCoverNegativeCache.findUnique({
      where: { key },
      select: { updatedAt: true, httpStatus: true, reason: true },
    });
    if (neg) {
      const age = Date.now() - new Date(neg.updatedAt).getTime();
      if (age >= 0 && age < NEGATIVE_TTL_MS) {
        return null;
      }
    }

    const query = encodeURIComponent(`${artist} ${title}`);
    const queryUrl = `https://itunes.apple.com/search?term=${query}&entity=song&limit=3`;
    const itunesUrl = (() => {
      const u = new URL("https://itunes.apple.com/search");
      u.searchParams.set("term", `${artist} ${title}`);
      u.searchParams.set("entity", "song");
      u.searchParams.set("limit", "3");
      u.searchParams.set("country", "NL");
      return u.toString();
    })();
    const res = await fetch(itunesUrl, {
      next: { revalidate: 60 * 60 * 24 * 7 }, // 7 dagen cache (Next fetch cache)
      headers: {
        Accept: "application/json",
        // Sommige platformen/proxies weigeren iTunes zonder UA; dit is een veilige, neutrale UA.
        "User-Agent": "KISSFM/1.0 (+https://kissfm.nl)",
      },
    });

    if (!res.ok) {
      await prisma.albumCoverLookupLog
        .create({
          data: {
            key,
            artist: String(artist).slice(0, 160),
            title: String(title).slice(0, 160),
            source: "itunes",
            queryUrl: itunesUrl,
            httpStatus: res.status,
            error: `HTTP ${res.status}`,
          },
        })
        .catch(() => {});
      await prisma.albumCoverNegativeCache
        .upsert({
          where: { key },
          create: { key, reason: `HTTP ${res.status}`, httpStatus: res.status },
          update: { reason: `HTTP ${res.status}`, httpStatus: res.status },
        })
        .catch(() => {});

      // Fallback: Deezer (werkt vaak waar iTunes geblokkeerd is).
      const dz = await getAlbumCoverFromDeezer(artist, title);
      if (dz.coverUrl) {
        await prisma.albumCoverCache.upsert({ where: { key }, create: { key, coverUrl: dz.coverUrl }, update: { coverUrl: dz.coverUrl } });
        await prisma.albumCoverLookupLog.create({
          data: { key, artist: String(artist).slice(0, 160), title: String(title).slice(0, 160), source: "deezer", queryUrl: dz.queryUrl, httpStatus: 200, resultsCount: 1, coverUrl: dz.coverUrl },
        }).catch(() => {});
        return dz.coverUrl;
      }
      return null;
    }

    const data = await res.json();
    const resultsCount = Array.isArray(data?.results) ? data.results.length : 0;
    if (resultsCount > 0) {
      // iTunes geeft standaard 100x100 images, we maken er 512x512 van door de URL aan te passen
      const cover = String(data.results[0].artworkUrl100 || "")
        .replace("100x100bb.jpg", "512x512bb.jpg")
        .trim();
      if (!cover) return null;
      await prisma.albumCoverCache.upsert({
        where: { key },
        create: { key, coverUrl: cover },
        update: { coverUrl: cover },
      });
      await prisma.albumCoverLookupLog
        .create({
          data: {
            key,
            artist: String(artist).slice(0, 160),
            title: String(title).slice(0, 160),
            source: "itunes",
            queryUrl: itunesUrl,
            httpStatus: 200,
            resultsCount,
            coverUrl: cover,
          },
        })
        .catch(() => {});
      await prisma.albumCoverNegativeCache.delete({ where: { key } }).catch(() => {});
      return cover;
    }

    await prisma.albumCoverLookupLog
      .create({
        data: {
          key,
          artist: String(artist).slice(0, 160),
          title: String(title).slice(0, 160),
          source: "itunes",
          queryUrl: itunesUrl,
          httpStatus: 200,
          resultsCount: 0,
          error: "No results",
        },
      })
      .catch(() => {});

    await prisma.albumCoverNegativeCache
      .upsert({
        where: { key },
        create: { key, reason: "No results", httpStatus: 200 },
        update: { reason: "No results", httpStatus: 200 },
      })
      .catch(() => {});

    // Fallback: Deezer bij 0 iTunes results.
    const dz = await getAlbumCoverFromDeezer(artist, title);
    if (dz.coverUrl) {
      await prisma.albumCoverCache.upsert({ where: { key }, create: { key, coverUrl: dz.coverUrl }, update: { coverUrl: dz.coverUrl } });
      await prisma.albumCoverLookupLog.create({
        data: { key, artist: String(artist).slice(0, 160), title: String(title).slice(0, 160), source: "deezer", queryUrl: dz.queryUrl, httpStatus: 200, resultsCount: 1, coverUrl: dz.coverUrl },
      }).catch(() => {});
      await prisma.albumCoverNegativeCache.delete({ where: { key } }).catch(() => {});
      return dz.coverUrl;
    }
    return null;
  } catch (error) {
    console.error("Fout bij ophalen album cover:", error);
    try {
      const key = trackKeyNorm(artist, title);
      await prisma.albumCoverLookupLog.create({
        data: {
          key,
          artist: String(artist).slice(0, 160),
          title: String(title).slice(0, 160),
          source: "itunes",
          error: String((error as any)?.message || error || "Unknown error").slice(0, 500),
        },
      });
      await prisma.albumCoverNegativeCache
        .upsert({
          where: { key },
          create: { key, reason: "Exception", httpStatus: null },
          update: { reason: "Exception", httpStatus: null },
        })
        .catch(() => {});
    } catch {
      // ignore
    }
    return null;
  }
}
