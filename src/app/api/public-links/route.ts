import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_INSTAGRAM_URL = "https://instagram.com/kissfmnl";
const DEFAULT_WHATSAPP_URL = "https://wa.me/318001078";

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["PUBLIC_INSTAGRAM_URL", "PUBLIC_WHATSAPP_URL"] } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      instagramUrl: map.get("PUBLIC_INSTAGRAM_URL") || DEFAULT_INSTAGRAM_URL,
      whatsAppUrl: map.get("PUBLIC_WHATSAPP_URL") || DEFAULT_WHATSAPP_URL,
    });
  } catch {
    return NextResponse.json({
      instagramUrl: DEFAULT_INSTAGRAM_URL,
      whatsAppUrl: DEFAULT_WHATSAPP_URL,
    });
  }
}
