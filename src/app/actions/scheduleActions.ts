"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeUnderWebsite } from "@/lib/websiteDisk";
import { hasPortalPermission } from "@/lib/portalPermissions";
import { scheduleSlotPresentationEqual } from "@/lib/scheduleSlotPresentation";
import {
  parseProgramPresetsJson,
  serializeProgramPresetsJson,
  type ProgramPreset,
} from "@/lib/programPresets";

function assertAdmin(session: any) {
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Niet geautoriseerd");
  }
}

function assertCanManageDjs(session: any) {
  if (!session) throw new Error("Niet geautoriseerd");
  if ((session.user as any)?.role === "ADMIN") return;
  if (!hasPortalPermission(session, "manageDjs")) {
    throw new Error("Niet geautoriseerd");
  }
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function isValidTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t);
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function parseFocusPercent(raw: FormDataEntryValue | null | undefined, fallback = 50): number {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseProgramColor(raw: FormDataEntryValue | null | undefined): string | null {
  const text = String(raw ?? "").trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(text)) return null;
  return text;
}

function pickUploadFromFormData(formData: FormData, fieldName: string): File | null {
  const entries = formData.getAll(fieldName).filter((v): v is File => v instanceof File);
  if (entries.length === 0) return null;
  for (const file of entries) {
    const name = String(file.name || "").trim().toLowerCase();
    const isPlaceholder =
      file.size === 0 &&
      (name === "" || name === "undefined") &&
      file.type === "application/octet-stream";
    if (!isPlaceholder) return file;
  }
  return entries[0] ?? null;
}

async function saveUpload(file: File | null, prefix = "jock") {
  if (!file) {
    console.log(`[upload][${prefix}] no file provided`);
    return null;
  }
  console.log(
    `[upload][${prefix}] received`,
    JSON.stringify({ name: file.name, type: file.type, size: file.size })
  );
  const placeholderName = String(file.name || "").trim().toLowerCase();
  const isPlaceholderUpload =
    file.size === 0 &&
    (placeholderName === "" || placeholderName === "undefined") &&
    file.type === "application/octet-stream";
  if (isPlaceholderUpload) {
    console.log(`[upload][${prefix}] ignored empty placeholder file input`);
    return null;
  }
  if (file.size === 0) {
    throw new Error(
      `Bestand '${file.name || "(onbekend)"}' is leeg of kon niet gelezen worden door de browser.`
    );
  }
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const safeExt = [".png", ".jpg", ".jpeg", ".jfif", ".webp", ".avif"].includes(ext) ? (ext === ".jfif" ? ".jpg" : ext) : ".jpg";
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  console.log(
    `[upload][${prefix}] incoming file`,
    JSON.stringify({ name: file.name, type: file.type, size: file.size, ext, safeExt })
  );
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Upload te groot (${Math.round(file.size / (1024 * 1024))}MB). Max is 10MB.`);
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await writeUnderWebsite(["uploads", fileName], bytes);
    console.log(`[upload][${prefix}] saved`, saved);
    return saved;
  } catch (e: any) {
    console.error(`[upload][${prefix}] failed`, {
      name: file.name,
      type: file.type,
      size: file.size,
      message: String(e?.message || e),
    });
    throw e;
  }
}

export async function upsertJock(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertCanManageDjs(session);
  console.log("[upsertJock] start");
  const debugImageEntries = formData
    .getAll("imageFile")
    .filter((v): v is File => v instanceof File)
    .map((f) => ({ name: f.name, type: f.type, size: f.size }));
  const debugProfileEntries = formData
    .getAll("profileImageFile")
    .filter((v): v is File => v instanceof File)
    .map((f) => ({ name: f.name, type: f.type, size: f.size }));
  console.log("[upsertJock] file entries", {
    imageFileCount: debugImageEntries.length,
    profileImageFileCount: debugProfileEntries.length,
    imageEntries: debugImageEntries,
    profileEntries: debugProfileEntries,
  });

  const id = (formData.get("id") as string | null) || null;
  const name = (formData.get("name") as string | null)?.trim() || "";
  const slugInput = (formData.get("slug") as string | null) || "";
  const imagePathInput = (formData.get("imagePath") as string | null)?.trim() || null;
  const uploadedImage = await saveUpload(pickUploadFromFormData(formData, "imageFile"), "jock");
  let imagePath = uploadedImage || imagePathInput;
  const profileImagePathInput = (formData.get("profileImagePath") as string | null)?.trim() || null;
  const uploadedProfileImage = await saveUpload(pickUploadFromFormData(formData, "profileImageFile"), "jock-profile");
  let profileImagePath = uploadedProfileImage || profileImagePathInput;
  const imageFocusX = parseFocusPercent(formData.get("imageFocusX"), 50);
  const imageFocusY = parseFocusPercent(formData.get("imageFocusY"), 50);
  const profileFocusX = parseFocusPercent(formData.get("profileFocusX"), 50);
  const profileFocusY = parseFocusPercent(formData.get("profileFocusY"), 50);
  const isActive = formData.get("isActive") === "on";
  const bioText = (formData.get("bioText") as string | null)?.trim() || null;
  const factsRaw = (formData.get("personalFactsJson") as string | null) ?? "";
  let personalFactsJson: string | null = null;
  const trimmedFacts = factsRaw.trim();
  if (trimmedFacts) {
    try {
      const parsed = JSON.parse(trimmedFacts);
      if (!Array.isArray(parsed)) throw new Error("expected array");
      const normalized = parsed.map((row: unknown) => {
        if (!row || typeof row !== "object") throw new Error("bad row");
        const q = String((row as any).question ?? "").trim();
        const a = String((row as any).answer ?? "").trim();
        return { question: q, answer: a };
      });
      const nonEmpty = normalized.filter((r) => r.question || r.answer);
      personalFactsJson = nonEmpty.length ? JSON.stringify(nonEmpty) : null;
    } catch {
      return { success: false as const, error: "Fun facts konden niet worden verwerkt." };
    }
  }

  const cardQuoteRaw = (formData.get("cardQuote") as string | null)?.trim() || "";
  const cardQuote = cardQuoteRaw.length > 0 ? cardQuoteRaw.slice(0, 220) : null;

  if (!name) return { success: false as const, error: "Naam is verplicht." };

  const slug = normalizeSlug(slugInput || name);
  if (!slug) return { success: false as const, error: "Slug ongeldig." };

  try {
    if (id) {
      if (!uploadedImage && imagePathInput === null) {
        const existing = await prisma.jock.findUnique({ where: { id }, select: { imagePath: true } });
        imagePath = existing?.imagePath ?? null;
      }
      if (!uploadedProfileImage && profileImagePathInput === null) {
        const existing = await prisma.jock.findUnique({ where: { id }, select: { profileImagePath: true } });
        profileImagePath = existing?.profileImagePath ?? null;
      }
      await prisma.jock.update({
        where: { id },
        data: {
          name,
          slug,
          imagePath,
          profileImagePath,
          imageFocusX,
          imageFocusY,
          profileFocusX,
          profileFocusY,
          bioText,
          isActive,
          personalFactsJson,
          cardQuote,
        },
      });
    } else {
      await prisma.jock.create({
        data: {
          name,
          slug,
          imagePath,
          profileImagePath,
          imageFocusX,
          imageFocusY,
          profileFocusX,
          profileFocusY,
          bioText,
          isActive,
          personalFactsJson,
          cardQuote,
        },
      });
    }

    revalidatePath("/admin/programmering");
    revalidatePath("/settings/programmering");
    revalidatePath("/programmering");
    revalidatePath("/djs", "layout");
    revalidatePath("/admin/djs");
    return { success: true as const };
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg) {
      if (msg.includes("WEBSITE_FILES_ROOT")) {
        return { success: false as const, error: msg };
      }
      if (msg.toLowerCase().includes("too large") || msg.toLowerCase().includes("body")) {
        return { success: false as const, error: "Upload mislukt: bestand te groot voor huidige uploadlimiet." };
      }
    }
    return { success: false as const, error: "Opslaan mislukt (controleer slug/upload en probeer opnieuw)." };
  }
}

export async function deleteJock(jockId: string) {
  const session = await getServerSession(authOptions);
  assertCanManageDjs(session);

  await prisma.jock.delete({ where: { id: jockId } });
  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  revalidatePath("/djs", "layout");
  revalidatePath("/admin/djs");
  return { success: true as const };
}

export async function upsertSlot(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const id = (formData.get("id") as string | null) || null;
  const jockId = (formData.get("jockId") as string | null) || "";
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = (formData.get("startTime") as string | null) || "";
  const endTime = (formData.get("endTime") as string | null) || "";
  const label = (formData.get("label") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const coHostName = (formData.get("coHostName") as string | null)?.trim() || null;
  const programColor = parseProgramColor(formData.get("programColor"));
  const programImagePathInput = (formData.get("programImagePath") as string | null)?.trim() || null;
  const uploadedProgramImage = await saveUpload(pickUploadFromFormData(formData, "programImageFile"), "program");
  const clearProgramImage = formData.get("clearProgramImage") === "on";
  let programImagePath = clearProgramImage ? null : uploadedProgramImage || programImagePathInput;

  if (!jockId) return { success: false as const, error: "Kies een DJ." };
  if (!Number.isFinite(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    return { success: false as const, error: "Dag ongeldig." };
  }
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return { success: false as const, error: "Tijd moet HH:MM zijn." };
  }
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return { success: false as const, error: "Eindtijd moet na starttijd liggen." };
  }

  // Basic overlap guard (same day)
  const existing = await prisma.scheduleSlot.findMany({
    where: {
      dayOfWeek,
      ...(id ? { NOT: { id } } : {}),
    },
    select: { startTime: true, endTime: true },
  });
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  const overlaps = existing.some((x) => {
    const xs = timeToMinutes(x.startTime);
    const xe = timeToMinutes(x.endTime);
    return s < xe && e > xs;
  });
  if (overlaps) {
    return { success: false as const, error: "Dit tijdslot overlapt met een bestaand slot." };
  }

  if (id) {
    if (!clearProgramImage && !uploadedProgramImage && !programImagePathInput) {
      const existingSlot = await prisma.scheduleSlot.findUnique({ where: { id }, select: { programImagePath: true } });
      programImagePath = existingSlot?.programImagePath ?? null;
    }
    await prisma.scheduleSlot.update({
      where: { id },
      data: { jockId, dayOfWeek, startTime, endTime, label, notes, coHostName, programImagePath, programColor },
    });
  } else {
    await prisma.scheduleSlot.create({
      data: { jockId, dayOfWeek, startTime, endTime, label, notes, coHostName, programImagePath, programColor },
    });
  }

  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  return { success: true as const };
}

export async function deleteSlot(slotId: string) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  await prisma.scheduleSlot.delete({ where: { id: slotId } });
  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  return { success: true as const };
}

/**
 * Bulk: zelfde programmanaam / tekst / foto / co-host op alle geselecteerde vaste tijdsloten (bijv. ma–vr hetzelfde programma).
 */
export async function bulkUpdateScheduleSlotProgramFields(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  let slotIds: string[] = [];
  try {
    const raw = String(formData.get("slotIds") || "").trim();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return { success: false as const, error: "Geen sloten geselecteerd." };
    }
    if (!parsed.every((x) => typeof x === "string" && x.length > 0)) {
      return { success: false as const, error: "Ongeldige slot-lijst." };
    }
    slotIds = parsed as string[];
  } catch {
    return { success: false as const, error: "Ongeldige slot-lijst." };
  }

  const found = await prisma.scheduleSlot.findMany({ where: { id: { in: slotIds } }, select: { id: true } });
  if (found.length !== slotIds.length) {
    return { success: false as const, error: "Een of meer sloten bestaan niet (meer)." };
  }

  const label = String(formData.get("label") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const coHostName = String(formData.get("coHostName") ?? "").trim() || null;
  const programColor = parseProgramColor(formData.get("programColor"));
  const preset = await readPresetFromForm(formData);
  const imageModeRaw = String(formData.get("programImageMode") || "keep").trim();
  const uploadedProgramImage = await saveUpload(pickUploadFromFormData(formData, "programImageFile"), "program");
  const programImagePathInput = (formData.get("programImagePath") as string | null)?.trim() || null;
  const imageMode =
    imageModeRaw === "keep" && (Boolean(uploadedProgramImage) || Boolean(programImagePathInput)) ? "set" : imageModeRaw;
  const baseProgramImagePath = imageMode === "clear" ? null : uploadedProgramImage || programImagePathInput;
  const presetApplied = applyPresetToProgramFields(preset, {
    label,
    notes,
    coHostName,
    programImagePath: baseProgramImagePath,
    hasManualProgramImageInput: Boolean(programImagePathInput),
    hasManualUpload: Boolean(uploadedProgramImage),
    clearProgramImage: imageMode === "clear",
    programColor,
  });
  const finalLabel = presetApplied.label;
  const finalNotes = presetApplied.notes;
  const finalCoHostName = presetApplied.coHostName;
  const finalProgramColor = programColor || preset?.programColor || null;

  for (const sid of slotIds) {
    const data: {
      label: string | null;
      notes: string | null;
      coHostName: string | null;
      programImagePath?: string | null;
      programColor?: string | null;
    } = { label: finalLabel, notes: finalNotes, coHostName: finalCoHostName, programColor: finalProgramColor };

    if (imageMode === "clear") {
      data.programImagePath = null;
    } else if (imageMode === "set") {
      if (uploadedProgramImage) {
        data.programImagePath = uploadedProgramImage;
      } else if (programImagePathInput) {
        data.programImagePath = programImagePathInput;
      } else {
        const ex = await prisma.scheduleSlot.findUnique({ where: { id: sid }, select: { programImagePath: true } });
        data.programImagePath = ex?.programImagePath ?? null;
      }
    }

    await prisma.scheduleSlot.update({ where: { id: sid }, data });
  }

  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  revalidatePath("/djs", "layout");
  return { success: true as const };
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

function parseExistingProgramSelection(formData: FormData): {
  jockId?: string;
  label?: string | null;
  notes?: string | null;
  coHostName?: string | null;
  programColor?: string | null;
} {
  const raw = String(formData.get("existingProgramJson") || "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const jockId = String(parsed.jockId || "").trim();
    const label = String(parsed.label || "").trim();
    const notes = String(parsed.notes || "").trim();
    const coHostName = String(parsed.coHostName || "").trim();
    const programColor = parseProgramColor(parsed.programColor as string);
    return {
      jockId: jockId || undefined,
      label: label || null,
      notes: notes || null,
      coHostName: coHostName || null,
      programColor,
    };
  } catch {
    return {};
  }
}

async function loadProgramPresets() {
  const row = await prisma.siteSetting.findUnique({
    where: { key: "PROGRAM_PRESETS_JSON" },
    select: { value: true },
  });
  return parseProgramPresetsJson(row?.value);
}

async function readPresetFromForm(formData: FormData): Promise<ProgramPreset | null> {
  const presetId = String(formData.get("presetId") || "").trim();
  if (!presetId) return null;
  const presets = await loadProgramPresets();
  return presets.find((p) => p.id === presetId) ?? null;
}

function applyPresetToProgramFields(
  preset: ProgramPreset | null,
  fields: {
    label: string | null;
    notes: string | null;
    coHostName: string | null;
    programImagePath: string | null;
    hasManualProgramImageInput: boolean;
    hasManualUpload: boolean;
    clearProgramImage: boolean;
    programColor: string | null;
  }
) {
  if (!preset) return fields;
  const next = { ...fields };
  next.label = preset.label;
  next.notes = preset.notes;
  next.coHostName = preset.coHostName;
  if (!next.clearProgramImage && !next.hasManualUpload && !next.hasManualProgramImageInput) {
    next.programImagePath = preset.programImagePath;
  }
  if (!next.programColor && preset.programColor) next.programColor = preset.programColor;
  return next;
}

export async function upsertTemporarySlot(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const id = (formData.get("id") as string | null) || null;
  const existingProgram = parseExistingProgramSelection(formData);
  let jockId = (formData.get("jockId") as string | null) || "";
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = (formData.get("startTime") as string | null) || "";
  const endTime = (formData.get("endTime") as string | null) || "";
  const startsOnRaw = (formData.get("startsOn") as string | null) || "";
  const endsOnRaw = (formData.get("endsOn") as string | null) || "";
  let label = (formData.get("label") as string | null)?.trim() || null;
  let notes = (formData.get("notes") as string | null)?.trim() || null;
  let coHostName = (formData.get("coHostName") as string | null)?.trim() || null;
  let programColor = parseProgramColor(formData.get("programColor"));
  if (existingProgram.jockId) jockId = existingProgram.jockId;
  if (existingProgram.label !== undefined) label = existingProgram.label;
  if (existingProgram.notes !== undefined) notes = existingProgram.notes;
  if (existingProgram.coHostName !== undefined) coHostName = existingProgram.coHostName;
  if (existingProgram.programColor !== undefined) programColor = existingProgram.programColor ?? null;
  const preset = await readPresetFromForm(formData);
  const programImagePathInput = (formData.get("programImagePath") as string | null)?.trim() || null;
  const uploadedProgramImage = await saveUpload(pickUploadFromFormData(formData, "programImageFile"), "program");
  const clearProgramImage = formData.get("clearProgramImage") === "on";
  let programImagePath = clearProgramImage ? null : uploadedProgramImage || programImagePathInput;
  const presetApplied = applyPresetToProgramFields(preset, {
    label,
    notes,
    coHostName,
    programImagePath,
    hasManualProgramImageInput: Boolean(programImagePathInput),
    hasManualUpload: Boolean(uploadedProgramImage),
    clearProgramImage,
    programColor,
  });
  const finalLabel = presetApplied.label;
  const finalNotes = presetApplied.notes;
  const finalCoHostName = presetApplied.coHostName;
  const finalProgramColor = presetApplied.programColor;
  programImagePath = presetApplied.programImagePath;
  const isActive = formData.get("isActive") === "on";

  if (!jockId) return { success: false as const, error: "Kies een DJ." };
  if (!Number.isFinite(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    return { success: false as const, error: "Dag ongeldig." };
  }
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return { success: false as const, error: "Tijd moet HH:MM zijn." };
  }
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return { success: false as const, error: "Eindtijd moet na starttijd liggen." };
  }
  const startsOn = parseYmdToUtcDate(startsOnRaw);
  const endsOn = parseYmdToUtcDate(endsOnRaw);
  if (endsOn < startsOn) {
    return { success: false as const, error: "Einddatum moet op of na startdatum liggen." };
  }

  const existing = await prisma.scheduleTemporarySlot.findMany({
    where: {
      dayOfWeek,
      startsOn: { lte: endsOn },
      endsOn: { gte: startsOn },
      ...(id ? { NOT: { id } } : {}),
    },
    select: { startTime: true, endTime: true },
  });
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  const overlaps = existing.some((x) => {
    const xs = timeToMinutes(x.startTime);
    const xe = timeToMinutes(x.endTime);
    return s < xe && e > xs;
  });
  if (overlaps) {
    return { success: false as const, error: "Dit tijdelijke slot overlapt met een bestaand tijdelijk slot." };
  }

  let savedId = id;

  if (id) {
    if (!clearProgramImage && !uploadedProgramImage && !programImagePathInput) {
      const existingSlot = await prisma.scheduleTemporarySlot.findUnique({ where: { id }, select: { programImagePath: true } });
      programImagePath = existingSlot?.programImagePath ?? null;
    }
    await prisma.scheduleTemporarySlot.update({
      where: { id },
      data: { jockId, dayOfWeek, startTime, endTime, startsOn, endsOn, label: finalLabel, notes: finalNotes, coHostName: finalCoHostName, programImagePath, programColor: finalProgramColor, isActive },
    });
  } else {
    const created = await prisma.scheduleTemporarySlot.create({
      data: { jockId, dayOfWeek, startTime, endTime, startsOn, endsOn, label: finalLabel, notes: finalNotes, coHostName: finalCoHostName, programImagePath, programColor: finalProgramColor, isActive },
      select: { id: true },
    });
    savedId = created.id;
  }

  // Eendaagse override die weer exact gelijk is aan het vaste slot: opruimen zodat "tijdelijk" niet blijft hangen.
  if (savedId) {
    const row = await prisma.scheduleTemporarySlot.findUnique({ where: { id: savedId } });
    if (row) {
      const sameCalendarDay =
        row.startsOn.toISOString().slice(0, 10) === row.endsOn.toISOString().slice(0, 10);
      if (sameCalendarDay) {
        const base = await prisma.scheduleSlot.findFirst({
          where: { dayOfWeek: row.dayOfWeek, startTime: row.startTime, endTime: row.endTime },
        });
        if (base && scheduleSlotPresentationEqual(row, base)) {
          await prisma.scheduleTemporarySlot.delete({ where: { id: savedId } });
        }
      }
    }
  }

  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  revalidatePath("/djs", "layout");
  return { success: true as const };
}

export async function deleteTemporarySlot(slotId: string) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  await prisma.scheduleTemporarySlot.delete({ where: { id: slotId } });
  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  revalidatePath("/djs", "layout");
  return { success: true as const };
}

/**
 * Plan een nieuwe "standaard" programmeringsregel vanaf een datum.
 * Vanaf vandaag/het verleden: schrijf direct naar de vaste programmering.
 * Voor een datum in de toekomst: bewaar als tijdelijke ingeplande wijziging.
 */
export async function upsertStandardChangeFromDate(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const effectiveFromRaw = (formData.get("effectiveFrom") as string | null) || "";
  const existingProgram = parseExistingProgramSelection(formData);
  let jockId = (formData.get("jockId") as string | null) || "";
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = (formData.get("startTime") as string | null) || "";
  const endTime = (formData.get("endTime") as string | null) || "";
  let label = (formData.get("label") as string | null)?.trim() || null;
  let notes = (formData.get("notes") as string | null)?.trim() || null;
  let coHostName = (formData.get("coHostName") as string | null)?.trim() || null;
  let programColor = parseProgramColor(formData.get("programColor"));
  if (existingProgram.jockId) jockId = existingProgram.jockId;
  if (existingProgram.label !== undefined) label = existingProgram.label;
  if (existingProgram.notes !== undefined) notes = existingProgram.notes;
  if (existingProgram.coHostName !== undefined) coHostName = existingProgram.coHostName;
  if (existingProgram.programColor !== undefined) programColor = existingProgram.programColor ?? null;
  const preset = await readPresetFromForm(formData);
  const programImagePathInput = (formData.get("programImagePath") as string | null)?.trim() || null;
  const uploadedProgramImage = await saveUpload(pickUploadFromFormData(formData, "programImageFile"), "program");
  const clearProgramImage = formData.get("clearProgramImage") === "on";
  let programImagePath = clearProgramImage ? null : uploadedProgramImage || programImagePathInput;
  const presetApplied = applyPresetToProgramFields(preset, {
    label,
    notes,
    coHostName,
    programImagePath,
    hasManualProgramImageInput: Boolean(programImagePathInput),
    hasManualUpload: Boolean(uploadedProgramImage),
    clearProgramImage,
    programColor,
  });
  const finalLabel = presetApplied.label;
  const finalNotes = presetApplied.notes;
  const finalCoHostName = presetApplied.coHostName;
  const finalProgramColor = presetApplied.programColor;
  programImagePath = presetApplied.programImagePath;

  if (!jockId) return { success: false as const, error: "Kies een DJ." };
  if (!Number.isFinite(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    return { success: false as const, error: "Dag ongeldig." };
  }
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return { success: false as const, error: "Tijd moet HH:MM zijn." };
  }
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return { success: false as const, error: "Eindtijd moet na starttijd liggen." };
  }

  const startsOn = parseYmdToUtcDate(effectiveFromRaw);
  const today = new Date();
  const todayUtcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const isFutureEffectiveDate = startsOn > todayUtcDate;

  if (!isFutureEffectiveDate) {
    const existingBase = await prisma.scheduleSlot.findFirst({
      where: { dayOfWeek, startTime, endTime },
      select: { id: true, programImagePath: true },
    });
    if (!clearProgramImage && !uploadedProgramImage && !programImagePathInput && existingBase) {
      programImagePath = existingBase.programImagePath ?? null;
    }
    if (existingBase) {
      await prisma.scheduleSlot.update({
        where: { id: existingBase.id },
        data: { jockId, coHostName: finalCoHostName, label: finalLabel, notes: finalNotes, programImagePath, programColor: finalProgramColor },
      });
    } else {
      await prisma.scheduleSlot.create({
        data: { dayOfWeek, startTime, endTime, jockId, coHostName: finalCoHostName, label: finalLabel, notes: finalNotes, programImagePath, programColor: finalProgramColor },
      });
    }

    // Bij standaardwijziging: verwijder tijdelijke overrides voor hetzelfde tijdslot vanaf deze datum.
    await prisma.scheduleTemporarySlot.deleteMany({
      where: {
        dayOfWeek,
        startTime,
        endTime,
        startsOn: { gte: startsOn },
      },
    });
  } else {
    const endsOn = new Date(Date.UTC(2099, 11, 31));
    await prisma.scheduleTemporarySlot.create({
      data: {
        startsOn,
        endsOn,
        dayOfWeek,
        startTime,
        endTime,
        jockId,
        coHostName: finalCoHostName,
        label: finalLabel,
        notes: finalNotes,
        programImagePath,
        programColor: finalProgramColor,
        isActive: true,
      },
    });
  }

  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  revalidatePath("/djs", "layout");
  return { success: true as const };
}

/**
 * Bewerking uit weekoverzicht:
 * - single_day: alleen gekozen datum (tijdelijke override voor 1 dag)
 * - from_week: vanaf weekstart doorvoeren als nieuwe standaardregel
 */
export async function applyScheduleEditFromWeek(formData: FormData) {
  const scope = String(formData.get("applyScope") || "single_day");
  if (scope === "from_week") {
    const weekStart = String(formData.get("weekStart") || "").trim();
    const fd = new FormData();
    fd.set("effectiveFrom", weekStart);
    fd.set("dayOfWeek", String(formData.get("dayOfWeek") || ""));
    fd.set("jockId", String(formData.get("jockId") || ""));
    fd.set("startTime", String(formData.get("startTime") || ""));
    fd.set("endTime", String(formData.get("endTime") || ""));
    fd.set("label", String(formData.get("label") || ""));
    fd.set("notes", String(formData.get("notes") || ""));
    fd.set("coHostName", String(formData.get("coHostName") || ""));
    fd.set("programColor", String(formData.get("programColor") || ""));
    fd.set("existingProgramJson", String(formData.get("existingProgramJson") || ""));
    fd.set("presetId", String(formData.get("presetId") || ""));
    fd.set("programImagePath", String(formData.get("programImagePath") || ""));
    if (formData.get("clearProgramImage") === "on") fd.set("clearProgramImage", "on");
    const file = formData.get("programImageFile");
    if (file instanceof File && file.size > 0) fd.set("programImageFile", file);
    return upsertStandardChangeFromDate(fd);
  }

  const targetYmd = String(formData.get("targetDate") || "").trim();
  const fd = new FormData();
  fd.set("startsOn", targetYmd);
  fd.set("endsOn", targetYmd);
  fd.set("dayOfWeek", String(formData.get("dayOfWeek") || ""));
  fd.set("jockId", String(formData.get("jockId") || ""));
  fd.set("startTime", String(formData.get("startTime") || ""));
  fd.set("endTime", String(formData.get("endTime") || ""));
  fd.set("label", String(formData.get("label") || ""));
  fd.set("notes", String(formData.get("notes") || ""));
  fd.set("coHostName", String(formData.get("coHostName") || ""));
  fd.set("programColor", String(formData.get("programColor") || ""));
  fd.set("existingProgramJson", String(formData.get("existingProgramJson") || ""));
  fd.set("presetId", String(formData.get("presetId") || ""));
  fd.set("programImagePath", String(formData.get("programImagePath") || ""));
  fd.set("isActive", "on");
  if (formData.get("source") === "temp") {
    const id = String(formData.get("id") || "").trim();
    if (id) fd.set("id", id);
  }
  if (formData.get("clearProgramImage") === "on") fd.set("clearProgramImage", "on");
  const file = formData.get("programImageFile");
  if (file instanceof File && file.size > 0) fd.set("programImageFile", file);
  return upsertTemporarySlot(fd);
}

export async function upsertProgramPreset(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { success: false as const, error: "Preset naam is verplicht." };

  const preset: ProgramPreset = {
    id: id || `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    label: String(formData.get("label") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    coHostName: String(formData.get("coHostName") || "").trim() || null,
    programImagePath: String(formData.get("programImagePath") || "").trim() || null,
    programColor: parseProgramColor(formData.get("programColor")),
    updatedAt: new Date().toISOString(),
  };

  const presets = await loadProgramPresets();
  const idx = presets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.push(preset);

  await prisma.siteSetting.upsert({
    where: { key: "PROGRAM_PRESETS_JSON" },
    update: { value: serializeProgramPresetsJson(presets) },
    create: { key: "PROGRAM_PRESETS_JSON", value: serializeProgramPresetsJson(presets) },
  });

  revalidatePath("/settings/programmering");
  return { success: true as const };
}

export async function deleteProgramPreset(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const id = String(formData.get("id") || "").trim();
  if (!id) return { success: false as const, error: "Preset niet gevonden." };

  const presets = await loadProgramPresets();
  const next = presets.filter((p) => p.id !== id);

  await prisma.siteSetting.upsert({
    where: { key: "PROGRAM_PRESETS_JSON" },
    update: { value: serializeProgramPresetsJson(next) },
    create: { key: "PROGRAM_PRESETS_JSON", value: serializeProgramPresetsJson(next) },
  });

  revalidatePath("/settings/programmering");
  return { success: true as const };
}

export async function updateOwnJockProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPortalPermission(session, "editOwnJockProfile")) {
    throw new Error("Niet geautoriseerd");
  }

  const userName = String((session.user as any)?.name || "").trim();
  if (!userName) {
    return { success: false as const, error: "Je account heeft geen naam." };
  }

  const bioText = (formData.get("bioText") as string | null)?.trim() || null;
  const factsRaw = (formData.get("personalFactsJson") as string | null) ?? "";
  let personalFactsJson: string | null = null;
  const trimmedFacts = factsRaw.trim();
  if (trimmedFacts) {
    try {
      const parsed = JSON.parse(trimmedFacts);
      if (!Array.isArray(parsed)) throw new Error("expected array");
      const normalized = parsed.map((row: unknown) => {
        if (!row || typeof row !== "object") throw new Error("bad row");
        const q = String((row as any).question ?? "").trim();
        const a = String((row as any).answer ?? "").trim();
        return { question: q, answer: a };
      });
      const nonEmpty = normalized.filter((r) => r.question || r.answer);
      personalFactsJson = nonEmpty.length ? JSON.stringify(nonEmpty) : null;
    } catch {
      return { success: false as const, error: "Fun facts konden niet worden verwerkt." };
    }
  }

  const jock = await prisma.jock.findFirst({
    where: { name: { equals: userName, mode: "insensitive" } },
    select: { id: true },
  });
  if (!jock) {
    return { success: false as const, error: "Geen DJ-profiel gevonden met jouw accountnaam." };
  }

  await prisma.jock.update({
    where: { id: jock.id },
    data: { bioText, personalFactsJson },
  });

  revalidatePath("/djs", "layout");
  revalidatePath("/dashboard/mijn-profiel");
  return { success: true as const };
}

export async function resetProgrammingData(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const confirmText = String(formData.get("confirmText") || "").trim();
  if (confirmText !== "RESET") {
    return { success: false as const, error: "Bevestiging ongeldig. Typ exact RESET om door te gaan." };
  }

  await prisma.scheduleTemporarySlot.deleteMany({});
  await prisma.scheduleSlot.deleteMany({});

  revalidatePath("/admin/programmering");
  revalidatePath("/settings/programmering");
  revalidatePath("/programmering");
  revalidatePath("/djs", "layout");
  return { success: true as const };
}

