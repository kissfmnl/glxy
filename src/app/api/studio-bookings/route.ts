import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { googleCalendarUrl, STUDIO_PURPOSE_OPTIONS, type StudioPurpose } from "@/lib/studioBookingUtils";

function parseDate(v: unknown) {
  const d = new Date(String(v || ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

function purposeLabel(v: StudioPurpose) {
  return STUDIO_PURPOSE_OPTIONS.find((p) => p.value === v)?.label || v;
}

const CUSTOM_PREFIX = "[CUSTOM_TYPE]";
function splitCustomType(rawNotes: string | null | undefined): { customType: string | null; notes: string | null } {
  const n = String(rawNotes || "").trim();
  if (!n.startsWith(CUSTOM_PREFIX)) return { customType: null, notes: n || null };
  const lineEnd = n.indexOf("\n");
  const head = (lineEnd === -1 ? n : n.slice(0, lineEnd)).replace(CUSTOM_PREFIX, "").trim();
  const rest = lineEnd === -1 ? "" : n.slice(lineEnd + 1).trim();
  return { customType: head || null, notes: rest || null };
}

function mergeCustomType(customType: string | null, notes: string | null) {
  const c = String(customType || "").trim();
  const n = String(notes || "").trim();
  if (!c) return n || null;
  return `${CUSTOM_PREFIX} ${c}${n ? `\n${n}` : ""}`;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });

  const url = new URL(req.url);
  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"));
  if (!from || !to || from >= to) {
    return NextResponse.json({ error: "Ongeldige range." }, { status: 400 });
  }

  const rows = await prisma.studioBooking.findMany({
    where: {
      isCancelled: false,
      startAt: { lt: to },
      endAt: { gt: from },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      title: true,
      purpose: true,
      notes: true,
      bookedByName: true,
      bookedByUserId: true,
      recurrenceGroupId: true,
    },
  });

  return NextResponse.json({
    bookings: rows.map((r) => ({
      ...r,
      customType: splitCustomType(r.notes).customType,
      notes: splitCustomType(r.notes).notes,
      googleUrl: googleCalendarUrl({
        title: r.title,
        startAt: new Date(r.startAt),
        endAt: new Date(r.endAt),
        details: `${purposeLabel(r.purpose as StudioPurpose)}${splitCustomType(r.notes).customType ? ` (${splitCustomType(r.notes).customType})` : ""}${splitCustomType(r.notes).notes ? `\n${splitCustomType(r.notes).notes}` : ""}`,
      }),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "").trim() || null;
  const startAt = parseDate(body?.startAt);
  const endAtInput = parseDate(body?.endAt);
  const minutes = Number(body?.minutes || 0);
  const repeatWeekly = Boolean(body?.repeatWeekly);
  const repeatCount = Math.min(Math.max(Number(body?.repeatCount || 1), 1), 24);
  const titleRaw = String(body?.title || "").trim();
  const purpose = String(body?.purpose || "CUSTOM").trim().toUpperCase() as StudioPurpose;
  const notes = String(body?.notes || "").trim() || null;
  const customType = String(body?.customType || "").trim() || null;
  const bookedByName = String((session.user as any)?.name || "DJ").trim() || "DJ";
  const bookedByUserId = String((session.user as any)?.id || "").trim() || null;
  const isAdmin = String((session.user as any)?.role || "") === "ADMIN";
  const defaultTitle = `${bookedByName} reservering`;
  const title = titleRaw || defaultTitle;

  let baseEnd: Date | null = endAtInput;
  if (!baseEnd && Number.isFinite(minutes) && minutes >= 15 && minutes <= 480 && startAt) {
    baseEnd = new Date(startAt.getTime() + minutes * 60000);
  }
  if (!startAt || !baseEnd || baseEnd <= startAt) {
    return NextResponse.json({ error: "Ongeldige start/eindtijd." }, { status: 400 });
  }
  if ((baseEnd.getTime() - startAt.getTime()) / 60000 > 720) {
    return NextResponse.json({ error: "Reservering mag maximaal 12 uur duren." }, { status: 400 });
  }
  if (!["VT", "LIVE", "DEMO", "CUSTOM"].includes(purpose)) {
    return NextResponse.json({ error: "Ongeldig type." }, { status: 400 });
  }

  const groupId = repeatWeekly && repeatCount > 1 ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null;

  if (id) {
    const existing = await prisma.studioBooking.findUnique({
      where: { id },
      select: { id: true, bookedByUserId: true, recurrenceGroupId: true, isCancelled: true },
    });
    if (!existing || existing.isCancelled) return NextResponse.json({ error: "Reservering niet gevonden." }, { status: 404 });
    if (!isAdmin && existing.bookedByUserId && existing.bookedByUserId !== bookedByUserId) {
      return NextResponse.json({ error: "Alleen de maker of admin kan wijzigen." }, { status: 403 });
    }

    const overlap = await prisma.studioBooking.findFirst({
      where: {
        id: { not: id },
        isCancelled: false,
        startAt: { lt: baseEnd },
        endAt: { gt: startAt },
      },
      select: { id: true, title: true, startAt: true, endAt: true },
    });
    if (overlap) {
      return NextResponse.json(
        {
          error: `Tijdslot bezet (${new Date(overlap.startAt).toLocaleString("nl-NL")} - ${new Date(overlap.endAt).toLocaleString("nl-NL")}): ${overlap.title}`,
        },
        { status: 409 }
      );
    }

    const row = await prisma.studioBooking.update({
      where: { id },
      data: {
        startAt,
        endAt: baseEnd,
        title,
        purpose,
        notes: mergeCustomType(purpose === "CUSTOM" ? customType : null, notes),
      },
    });
    return NextResponse.json({
      success: true,
      updated: true,
      googleUrl: googleCalendarUrl({
        title: row.title,
        startAt: row.startAt,
        endAt: row.endAt,
        details: `${purposeLabel(row.purpose as StudioPurpose)}${splitCustomType(row.notes).customType ? ` (${splitCustomType(row.notes).customType})` : ""}${splitCustomType(row.notes).notes ? `\n${splitCustomType(row.notes).notes}` : ""}`,
      }),
    });
  }

  const instances = Array.from({ length: repeatWeekly ? repeatCount : 1 }, (_, i) => {
    const start = new Date(startAt);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(baseEnd);
    end.setDate(end.getDate() + i * 7);
    return { start, end };
  });

  for (const inst of instances) {
    const overlap = await prisma.studioBooking.findFirst({
      where: {
        isCancelled: false,
        startAt: { lt: inst.end },
        endAt: { gt: inst.start },
      },
      select: { id: true, title: true, startAt: true, endAt: true },
    });
    if (overlap) {
      return NextResponse.json(
        {
          error: `Tijdslot bezet (${new Date(overlap.startAt).toLocaleString("nl-NL")} - ${new Date(overlap.endAt).toLocaleString("nl-NL")}): ${overlap.title}`,
        },
        { status: 409 }
      );
    }
  }

  const created = [];
  for (const inst of instances) {
    const row = await prisma.studioBooking.create({
      data: {
        startAt: inst.start,
        endAt: inst.end,
        title,
        purpose,
        notes: mergeCustomType(purpose === "CUSTOM" ? customType : null, notes),
        bookedByName,
        bookedByUserId,
        recurrenceGroupId: groupId,
      },
    });
    created.push(row);
  }

  return NextResponse.json({
    success: true,
    created: created.length,
    googleUrl: googleCalendarUrl({
      title,
      startAt: created[0].startAt,
      endAt: created[0].endAt,
      details: `${purposeLabel(purpose)}${purpose === "CUSTOM" && customType ? ` (${customType})` : ""}${notes ? `\n${notes}` : ""}`,
    }),
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  const isAdmin = String((session.user as any)?.role || "") === "ADMIN";
  const userId = String((session.user as any)?.id || "").trim() || null;
  const url = new URL(req.url);
  const id = String(url.searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "Ontbrekend id." }, { status: 400 });

  const existing = await prisma.studioBooking.findUnique({
    where: { id },
    select: { id: true, bookedByUserId: true, isCancelled: true },
  });
  if (!existing || existing.isCancelled) return NextResponse.json({ success: true });
  if (!isAdmin && existing.bookedByUserId && existing.bookedByUserId !== userId) {
    return NextResponse.json({ error: "Alleen de maker of admin kan verwijderen." }, { status: 403 });
  }

  await prisma.studioBooking.update({
    where: { id },
    data: { isCancelled: true },
  });
  return NextResponse.json({ success: true });
}
