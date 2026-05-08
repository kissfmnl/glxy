"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeHeroColorInput } from "@/lib/heroTitleColor";

function assertAdmin(session: any) {
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}

function parseYmdToUtcDate(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) throw new Error("Ongeldige datum");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new Error("Ongeldige datum");
  return new Date(Date.UTC(y, mo - 1, d));
}

function parseHHMMOrNull(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  if (!/^\d{2}:\d{2}$/.test(t)) throw new Error("Tijd moet HH:MM zijn");
  const [h, m] = t.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) throw new Error("Tijd moet HH:MM zijn");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function upsertHomeHeroHeadlineSlot(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const slotId = String(formData.get("slotId") || "").trim();
  const startsOn = String(formData.get("startsOn") || "").trim();
  const endsOn = String(formData.get("endsOn") || "").trim();
  const titleLine1 = String(formData.get("titleLine1") || "").trim();
  const titleLine2 = String(formData.get("titleLine2") || "").trim();
  const startTime = parseHHMMOrNull(String(formData.get("startTime") || ""));
  const endTime = parseHHMMOrNull(String(formData.get("endTime") || ""));
  const note = String(formData.get("note") || "").trim();
  const priority = Math.min(100, Math.max(0, Math.round(Number(formData.get("priority") || 0))));
  const titleLine1Color = normalizeHeroColorInput(String(formData.get("titleLine1Color") || ""), "white");
  const titleLine2Color = normalizeHeroColorInput(String(formData.get("titleLine2Color") || ""), "teal");

  const weekdayRaw = formData.getAll("weekday").map((v) => parseInt(String(v), 10));
  const weekdaysSet = new Set(weekdayRaw.filter((n) => n >= 1 && n <= 7));
  const weekdaysCsv =
    weekdaysSet.size > 0 ? Array.from(weekdaysSet).sort((a, b) => a - b).join(",") : null;

  if (!titleLine1) throw new Error("Titel regel 1 is verplicht");

  const startD = parseYmdToUtcDate(startsOn);
  const endD = parseYmdToUtcDate(endsOn);
  if (endD < startD) throw new Error("Einddatum moet op of na startdatum liggen");
  if ((startTime && !endTime) || (!startTime && endTime)) {
    throw new Error("Vul zowel starttijd als eindtijd in (of laat beide leeg)");
  }

  if (slotId) {
    const existing = await prisma.homeHeroHeadlineSlot.findUnique({ where: { id: slotId } });
    if (!existing) throw new Error("Periode niet gevonden");
    await prisma.homeHeroHeadlineSlot.update({
      where: { id: slotId },
      data: {
        startsOn: startD,
        endsOn: endD,
        weekdays: weekdaysCsv,
        startTime,
        endTime,
        titleLine1,
        titleLine2: titleLine2 || null,
        titleLine1Color,
        titleLine2Color,
        priority,
        note: note || null,
      },
    });
  } else {
    await prisma.homeHeroHeadlineSlot.create({
      data: {
        startsOn: startD,
        endsOn: endD,
        weekdays: weekdaysCsv,
        startTime,
        endTime,
        titleLine1,
        titleLine2: titleLine2 || null,
        titleLine1Color,
        titleLine2Color,
        priority,
        note: note || null,
        isActive: true,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/settings/home-hero-planning");
}

export async function deleteHomeHeroHeadlineSlot(id: string) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  await prisma.homeHeroHeadlineSlot.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/settings/home-hero-planning");
}

export async function setHomeHeroHeadlineSlotActive(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  await prisma.homeHeroHeadlineSlot.update({ where: { id }, data: { isActive } });
  revalidatePath("/");
  revalidatePath("/settings/home-hero-planning");
}
