import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

type Geo = { country: string | null; city: string | null };

function pickIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  return ip || null;
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

async function geoLookup(ip: string | null, req: NextRequest): Promise<Geo> {
  const headerCountry = req.headers.get("x-vercel-ip-country") || null;
  const headerCity = req.headers.get("x-vercel-ip-city") || null;
  if (!ip) return { country: headerCountry, city: headerCity };
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { cache: "no-store" });
    if (!res.ok) return { country: headerCountry, city: headerCity };
    const json = (await res.json()) as { country_name?: string; city?: string };
    return {
      country: json.country_name || headerCountry,
      city: json.city || headerCity,
    };
  } catch {
    return { country: headerCountry, city: headerCity };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { path?: string; referrer?: string };
    const path = (body.path || "/").slice(0, 180);
    const referrer = (body.referrer || "").slice(0, 500);
    const ip = pickIp(req);
    const geo = await geoLookup(ip, req);
    await prisma.visitEvent.create({
      data: {
        path,
        referrer: referrer || null,
        ipHash: hashIp(ip),
        country: geo.country,
        city: geo.city,
        userAgent: (req.headers.get("user-agent") || "").slice(0, 500) || null,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
