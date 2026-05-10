import { NextResponse } from "next/server";
import { buildGlxyStationsFromDb } from "@/lib/glxyStations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAllowedNowPlayingUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ text: "" });
  }

  let stationsConfig: unknown = null;
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true } });
    stationsConfig = row?.stationsConfig ?? null;
  } catch {
    return NextResponse.json({ text: "" });
  }

  const stations = buildGlxyStationsFromDb(stationsConfig);
  const station = stations.find((s) => s.id === id);
  const rawUrl = station?.nowPlayingUrl?.trim();
  if (!rawUrl || !isAllowedNowPlayingUrl(rawUrl)) {
    return NextResponse.json({ text: "" });
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(rawUrl, {
      signal: ctrl.signal,
      headers: { Accept: "text/plain,*/*" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json({ text: "" });
    }
    const body = await res.text();
    const line = body.trim().split(/\r?\n/).find((l) => l.trim()) ?? "";
    const text = line.trim().slice(0, 320);
    return NextResponse.json({ text }, { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } });
  } catch {
    return NextResponse.json({ text: "" });
  }
}
