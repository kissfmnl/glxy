"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPortalPermission } from "@/lib/portalPermissions";
import { trackKeyNorm } from "@/lib/trackNormalization";

function norm(v: FormDataEntryValue | null | undefined) {
  return String(v ?? "").trim();
}

export async function debugAlbumCoverLookup(formData: FormData): Promise<{
  ok: boolean;
  key?: string;
  cacheHit?: boolean;
  cachedCoverUrl?: string | null;
  queryUrl?: string;
  httpStatus?: number;
  resultsCount?: number;
  coverUrl?: string | null;
  error?: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session || !hasPortalPermission(session, "manageDeveloper")) {
    return { ok: false, error: "Niet geautoriseerd." };
  }

  const artist = norm(formData.get("artist"));
  const title = norm(formData.get("title"));
  if (!artist || !title) return { ok: false, error: "Vul artiest en titel in." };

  const key = trackKeyNorm(artist, title);
  const cached = await prisma.albumCoverCache.findUnique({ where: { key }, select: { coverUrl: true } });
  if (cached?.coverUrl) {
    return { ok: true, key, cacheHit: true, cachedCoverUrl: cached.coverUrl, coverUrl: cached.coverUrl };
  }

  const queryUrl = (() => {
    const u = new URL("https://itunes.apple.com/search");
    u.searchParams.set("term", `${artist} ${title}`);
    u.searchParams.set("entity", "song");
    u.searchParams.set("limit", "3");
    u.searchParams.set("country", "NL");
    return u.toString();
  })();
  try {
    const res = await fetch(queryUrl, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "KISSFM/1.0 (+https://kissfm.nl)" },
    });
    const httpStatus = res.status;
    if (!res.ok) {
      return { ok: true, key, cacheHit: false, queryUrl, httpStatus, error: `HTTP ${httpStatus}` };
    }
    const data = await res.json();
    const resultsCount = Array.isArray(data?.results) ? data.results.length : 0;
    const coverUrl =
      resultsCount > 0
        ? String(data.results[0]?.artworkUrl100 || "").replace("100x100bb.jpg", "512x512bb.jpg").trim() || null
        : null;
    return { ok: true, key, cacheHit: false, queryUrl, httpStatus, resultsCount, coverUrl };
  } catch (e: any) {
    return { ok: true, key, cacheHit: false, queryUrl, error: String(e?.message || "Lookup mislukt") };
  }
}

export async function clearAlbumCoverLookupLogs(): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !hasPortalPermission(session, "manageDeveloper")) {
    return { ok: false, error: "Niet geautoriseerd." };
  }
  await prisma.albumCoverLookupLog.deleteMany({});
  return { ok: true };
}

