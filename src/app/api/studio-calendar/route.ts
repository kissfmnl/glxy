import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_STUDIO_BOOKING_URL = "https://calendar.online/cd0577e1ec69b88742e9";
const DEFAULT_STUDIO_BOOKING_NOTE =
  "Via deze agenda kunnen mensen de studio reserveren om op te nemen.";

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["STUDIO_BOOKING_URL", "STUDIO_BOOKING_NOTE"] } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      bookingUrl: map.get("STUDIO_BOOKING_URL") || DEFAULT_STUDIO_BOOKING_URL,
      bookingNote: map.get("STUDIO_BOOKING_NOTE") || DEFAULT_STUDIO_BOOKING_NOTE,
    });
  } catch {
    return NextResponse.json({
      bookingUrl: DEFAULT_STUDIO_BOOKING_URL,
      bookingNote: DEFAULT_STUDIO_BOOKING_NOTE,
    });
  }
}
