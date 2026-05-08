import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { mergeScheduleSlotsForDay } from "@/lib/effectiveSchedule";

type ExportSlot = {
  dayOfWeek: number;
  date?: string;
  startTime: string;
  endTime: string;
  title: string;
  jockName: string;
  coHostName: string | null;
  notes: string | null;
  programImagePath: string | null;
  programImageUrl: string | null;
  source: "base" | "temp";
};

type WeekExport = {
  weekStart: string;
  weekEnd: string;
  slots: ExportSlot[];
};

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function mondayFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const js = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() - (js - 1));
  return dt;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayNameNl(id: number) {
  return ["", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"][id] || `Dag ${id}`;
}

function toProgramImageUrl(path: string | null | undefined): string | null {
  const value = String(path || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return "/api/assets/" + value.split("/").map(encodeURIComponent).join("/");
}

function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function toTime(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function withNonStopFill(list: ExportSlot[]) {
  const out: ExportSlot[] = [];
  for (let day = 1; day <= 7; day++) {
    const dayList = list
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    let cursor = 7 * 60;
    for (const slot of dayList) {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      if (slotStart > cursor) {
        out.push({
          dayOfWeek: day,
          date: slot.date,
          startTime: toTime(cursor),
          endTime: toTime(slotStart),
          title: "KISS Non-stop",
          jockName: "KISS Non-stop",
          coHostName: null,
          notes: null,
          programImagePath: null,
          programImageUrl: null,
          source: "base",
        });
      }
      out.push(slot);
      cursor = Math.max(cursor, slotEnd);
    }
    if (cursor < 24 * 60) {
      out.push({
        dayOfWeek: day,
        date: dayList[0]?.date,
        startTime: toTime(cursor),
        endTime: "23:59",
        title: "KISS Non-stop",
        jockName: "KISS Non-stop",
        coHostName: null,
        notes: null,
        programImagePath: null,
        programImageUrl: null,
        source: "base",
      });
    }
  }
  return out;
}

function toPlainText(weeks: WeekExport[]) {
  const lines: string[] = [];
  lines.push(`KISS FM programmering export`);
  lines.push(`Weken: ${weeks.length} (deze week + volgende week)`);
  lines.push("");
  for (const w of weeks) {
    lines.push(`Week: ${w.weekStart} t/m ${w.weekEnd}`);
    for (let day = 1; day <= 7; day++) {
      const daySlots = w.slots
        .filter((s) => s.dayOfWeek === day)
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      lines.push(`${dayNameNl(day)}${daySlots[0]?.date ? ` (${daySlots[0].date})` : ""}`);
      for (const s of daySlots) {
        const host = s.coHostName ? `${s.jockName} + ${s.coHostName}` : s.jockName;
        lines.push(`- ${s.startTime}-${s.endTime} | ${s.title} | ${host} | ${s.source}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const format = (req.nextUrl.searchParams.get("format") || "json").toLowerCase();
  const todayYmd = formatAmsterdamYMD();
  const currentWeekStart = mondayFromYmd(todayYmd);
  const nextWeekStart = addDays(currentWeekStart, 7);

  const [slots, temporarySlots] = await Promise.all([
    prisma.scheduleSlot.findMany({
      include: { jock: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.scheduleTemporarySlot.findMany({
      where: { isActive: true },
      include: { jock: true },
      orderBy: [{ startsOn: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  function buildWeekExport(weekStart: Date): WeekExport {
    const weekDays = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      date: ymd(addDays(weekStart, i)),
    }));
    const mergedWeek = weekDays.flatMap((d) =>
      mergeScheduleSlotsForDay(slots, temporarySlots, d.date, d.id).map((s) => ({
        dayOfWeek: s.dayOfWeek,
        date: d.date,
        startTime: s.startTime,
        endTime: s.endTime,
        title: (s.label ?? "").trim() || s.jock.name,
        jockName: s.jock.name,
        coHostName: s.coHostName ?? null,
        notes: s.notes ?? null,
        programImagePath: s.programImagePath ?? s.jock.imagePath ?? null,
        programImageUrl: toProgramImageUrl(s.programImagePath ?? s.jock.imagePath ?? null),
        source: s.source === "temp" ? ("temp" as const) : ("base" as const),
      }))
    );
    return {
      weekStart: ymd(weekStart),
      weekEnd: ymd(addDays(weekStart, 6)),
      slots: withNonStopFill(mergedWeek),
    };
  }

  const weeks = [buildWeekExport(currentWeekStart), buildWeekExport(nextWeekStart)];

  if (format === "txt" || format === "text" || format === "plain") {
    return new NextResponse(toPlainText(weeks), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      timezone: "Europe/Amsterdam",
      weeks,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

