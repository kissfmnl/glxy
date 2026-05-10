"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPortalAdmin } from "@/lib/authRoles";

function validateScheduleRows(rows: unknown[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return `Regel ${i + 1}: verwacht een object.`;
    }
    const r = row as Record<string, unknown>;
    const day = r.weekday ?? r.dayOfWeek;
    if (typeof day !== "number" || day < 1 || day > 7) {
      return `Regel ${i + 1}: weekday of dayOfWeek moet 1–7 zijn (ma=1 … zo=7).`;
    }
    const start = String(r.startHm ?? r.startTime ?? "").trim();
    const end = String(r.endHm ?? r.endTime ?? "").trim();
    const show = String(r.showName ?? r.label ?? "").trim();
    if (!/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) {
      return `Regel ${i + 1}: start- en eindtijd als HH:MM (bijv. 09:00).`;
    }
    if (!show) {
      return `Regel ${i + 1}: showName of label is verplicht.`;
    }
  }
  return null;
}

export async function updateProgrammingScheduleAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) {
    return { error: "Geen rechten." };
  }

  const raw = String(formData.get("scheduleJson") ?? "").trim();
  let scheduleValue: unknown | null = null;

  if (raw.length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return { error: "Ongeldige JSON." };
    }
    if (!Array.isArray(parsed)) {
      return { error: "Het schema moet een JSON-array zijn." };
    }
    const err = validateScheduleRows(parsed);
    if (err) return { error: err };
    scheduleValue = parsed;
  }

  try {
    await prisma.branding.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...(scheduleValue !== null ? { programmingSchedule: scheduleValue as Prisma.InputJsonValue } : {}),
      },
      update: {
        programmingSchedule:
          scheduleValue === null ? Prisma.DbNull : (scheduleValue as Prisma.InputJsonValue),
      },
    });
  } catch {
    return { error: "Opslaan mislukt." };
  }

  revalidatePath("/");
  revalidatePath("/programmering");
  revalidatePath("/admin/programmering");
  return { ok: true };
}
