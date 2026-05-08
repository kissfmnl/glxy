import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPortalPermission } from "@/lib/portalPermissions";
import { prisma } from "@/lib/prisma";

function sumIcecastListeners(json: any): number | null {
  const sources = json?.icestats?.source;
  if (!sources) return null;
  const arr = Array.isArray(sources) ? sources : [sources];
  let sum = 0;
  let any = false;
  for (const s of arr) {
    const n = Number(s?.listeners);
    if (Number.isFinite(n)) {
      sum += n;
      any = true;
    }
  }
  return any ? sum : null;
}

async function fetchStreamListeners(): Promise<number | null> {
  const candidates = [
    "https://stream.kissfm.nl/status-json.xsl",
    "https://stream.kissfm.nl/status-json.xsl?ts=" + Date.now(),
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = await res.json();
      const sum = sumIcecastListeners(json);
      if (typeof sum === "number") return sum;
    } catch {
      // ignore
    }
  }
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPortalPermission(session, "manageVisitors")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const d5m = new Date(now.getTime() - 5 * 60 * 1000);

  const [rows, streamListeners] = await Promise.all([
    prisma.visitEvent.findMany({
      where: { createdAt: { gte: d5m } },
      select: { ipHash: true },
    }),
    fetchStreamListeners(),
  ]);
  const uniq = new Set<string>();
  let unknown = 0;
  for (const r of rows) {
    if (r.ipHash) uniq.add(r.ipHash);
    else unknown += 1;
  }
  const activeSiteUsers5m = uniq.size + unknown;

  return NextResponse.json({
    activeSiteUsers5m,
    streamListeners,
    updatedAt: now.toISOString(),
  });
}

