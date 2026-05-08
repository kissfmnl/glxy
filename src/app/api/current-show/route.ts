import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";

export const dynamic = "force-dynamic";

function normalizeShowLabel(value: string) {
  const v = value.trim().toLowerCase();
  if (v === "non-stop" || v === "nonstop" || v === "kiss non-stop" || v === "kiss nonstop") return "KISS Non-stop";
  return value;
}

function minutesFromHHMM(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function inRange(now: number, start: number, end: number) {
  // Supports slots that pass midnight (e.g. 21:00 -> 00:00)
  if (end <= start) return now >= start || now < end;
  return now >= start && now < end;
}

export async function GET() {
  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
    const jsDay = now.getDay(); // 0=Sun..6=Sat
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1=Mon..7=Sun
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const [slots, temporarySlots] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { dayOfWeek },
        include: { jock: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.scheduleTemporarySlot.findMany({
        where: { dayOfWeek, isActive: true },
        include: { jock: true },
        orderBy: { startTime: "asc" },
      }),
    ]);
    const effectiveSlots = mergeScheduleSlotsForDay(slots, temporarySlots, formatAmsterdamYMD(), dayOfWeek);

    const currentSlot =
      effectiveSlots.find((s) =>
        inRange(nowMinutes, minutesFromHHMM(s.startTime), minutesFromHHMM(s.endTime)),
      ) || null;

    if (!currentSlot) return NextResponse.json({ found: false });

    return NextResponse.json({
      found: true,
      label: normalizeShowLabel(currentSlot.label || currentSlot.jock.name),
      time: `${currentSlot.startTime} - ${currentSlot.endTime}`,
      notes: currentSlot.notes,
      jock: {
        name: normalizeShowLabel(currentSlot.jock.name),
        imagePath: currentSlot.programImagePath || currentSlot.jock.imagePath,
      },
    });
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  }
}

