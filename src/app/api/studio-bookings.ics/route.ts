import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function esc(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function fmtUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET() {
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const to = new Date(now.getTime() + 365 * 24 * 3600 * 1000);

  const bookings = await prisma.studioBooking.findMany({
    where: {
      isCancelled: false,
      endAt: { gt: from },
      startAt: { lt: to },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      purpose: true,
      notes: true,
      bookedByName: true,
      updatedAt: true,
    },
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KISS FM//Studio Reservations//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:KISS FM Studio",
    "X-WR-TIMEZONE:Europe/Amsterdam",
  ];

  for (const b of bookings) {
    const desc = `Type: ${b.purpose}\\nDJ: ${b.bookedByName}${b.notes ? `\\nNotities: ${b.notes}` : ""}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:studio-${b.id}@kissfm`,
      `DTSTAMP:${fmtUtc(new Date(b.updatedAt))}`,
      `DTSTART:${fmtUtc(new Date(b.startAt))}`,
      `DTEND:${fmtUtc(new Date(b.endAt))}`,
      `SUMMARY:${esc(b.title)}`,
      `DESCRIPTION:${esc(desc)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
