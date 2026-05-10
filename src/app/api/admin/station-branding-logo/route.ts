import { buildGlxyStationsFromDb } from "@/lib/glxyStations";
import { authOptions } from "@/lib/auth";
import { isPortalAdmin } from "@/lib/authRoles";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isPortalAdmin(session.user.role)) {
    return new NextResponse(null, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) {
    return new NextResponse(null, { status: 400 });
  }

  let stationsConfig: unknown = null;
  try {
    const row = await prisma.branding.findUnique({ where: { id: 1 }, select: { stationsConfig: true } });
    stationsConfig = row?.stationsConfig ?? null;
  } catch {
    return new NextResponse(null, { status: 500 });
  }

  const stations = buildGlxyStationsFromDb(stationsConfig);
  const logoUrl = stations.find((s) => s.id === id)?.logoUrl?.trim();
  if (!logoUrl) {
    return new NextResponse(null, { status: 404 });
  }

  if (logoUrl.startsWith("data:image")) {
    const m = /^data:(image\/[^;]+);base64,([\s\S]+)$/.exec(logoUrl);
    if (m?.[1] && m[2]) {
      try {
        const buf = Buffer.from(m[2], "base64");
        return new NextResponse(buf, {
          headers: {
            "Content-Type": m[1],
            "Cache-Control": "private, max-age=120",
          },
        });
      } catch {
        return new NextResponse(null, { status: 500 });
      }
    }
  }

  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
    return NextResponse.redirect(logoUrl);
  }

  if (logoUrl.startsWith("/")) {
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(`${origin}${logoUrl}`);
  }

  return new NextResponse(null, { status: 404 });
}
