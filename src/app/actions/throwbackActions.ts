"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeUnderWebsite } from "@/lib/websiteDisk";

function assertAdmin(session: unknown) {
  if (!session || ((session as { user?: { role?: string } }).user?.role !== "ADMIN")) {
    throw new Error("Niet geautoriseerd");
  }
}

function normalizeText(v: FormDataEntryValue | null | undefined) {
  return String(v ?? "").trim();
}

function parseYear(v: FormDataEntryValue | null | undefined): number | null {
  const raw = normalizeText(v);
  if (!raw) return null;
  const year = Number(raw);
  if (!Number.isFinite(year)) return null;
  const n = Math.trunc(year);
  if (n < 1950 || n > 2100) return null;
  return n;
}

function parseOptionalYearString(value: string): number | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const y = Math.trunc(n);
  if (y < 1950 || y > 2100) return null;
  return y;
}

function parseSortOrder(v: FormDataEntryValue | null | undefined): number {
  const n = Number(normalizeText(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function normalizeTrackKey(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
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

function assertAllowedMime(mime: string, allowed: Set<string>, message: string) {
  if (!allowed.has(mime)) throw new Error(message);
}

async function saveImageUpload(file: File | null, prefix: string, maxMb: number, missingMessage: string, invalidMimeMessage: string) {
  if (!file || file.size === 0) throw new Error(missingMessage);
  const MAX_UPLOAD_BYTES = maxMb * 1024 * 1024;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`Bestand is te groot. Maximaal ${maxMb}MB.`);
  const mime = String(file.type || "").toLowerCase();
  const allowedMime = new Set(["image/png", "image/jpeg", "image/webp"]);
  assertAllowedMime(mime, allowedMime, invalidMimeMessage);
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const safeExt = ext === ".png" || ext === ".webp" ? ext : ".jpg";
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", "acties", fileName], bytes);
}

async function saveTeamPhoto(file: File | null) {
  return saveImageUpload(
    file,
    "throwback-team",
    8,
    "Upload een teamfoto om mee te doen.",
    "Gebruik een JPG, PNG of WEBP bestand voor de teamfoto."
  );
}

async function saveActionImage(file: File | null) {
  return saveImageUpload(
    file,
    "throwback-action",
    8,
    "Kies een afbeelding voor de actie.",
    "Gebruik een JPG, PNG of WEBP bestand voor de actie-afbeelding."
  );
}

async function saveSongCoverImage(file: File | null) {
  return saveImageUpload(
    file,
    "throwback-cover",
    8,
    "Kies een cover-afbeelding.",
    "Gebruik een JPG, PNG of WEBP bestand voor de album cover."
  );
}

async function saveAudioMessage(file: File | null) {
  if (!file || file.size === 0) return null;
  const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Audiobericht is te groot. Maximaal 20MB.");
  const mime = String(file.type || "").toLowerCase();
  const allowedMime = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg"]);
  assertAllowedMime(mime, allowedMime, "Gebruik een geldig audioformaat (mp3/wav/m4a/webm/ogg).");
  const ext = path.extname(file.name || "").toLowerCase() || ".mp3";
  const safeExt = [".mp3", ".wav", ".webm", ".m4a", ".aac", ".ogg"].includes(ext) ? ext : ".mp3";
  const fileName = `throwback-audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", "acties", fileName], bytes);
}

async function saveVideoMessage(file: File | null) {
  if (!file || file.size === 0) return null;
  const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Videobericht is te groot. Maximaal 100MB.");
  const mime = String(file.type || "").toLowerCase();
  const allowedMime = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]);
  assertAllowedMime(mime, allowedMime, "Gebruik een geldig videoformaat (mp4/webm/mov/avi).");
  const ext = path.extname(file.name || "").toLowerCase() || ".mp4";
  const safeExt = [".mp4", ".webm", ".mov", ".avi"].includes(ext) ? ext : ".mp4";
  const fileName = `throwback-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeUnderWebsite(["uploads", "acties", fileName], bytes);
}

async function sendThrowbackNotificationEmail(payload: {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  songs: Array<{ artist: string; title: string; year: number | null }>;
  hasAudio: boolean;
  hasVideo: boolean;
}) {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.THROWBACK_MAIL_FROM?.trim() || process.env.SMTP_FROM?.trim() || "no-reply@kissfm.nl";
  const to = process.env.THROWBACK_NOTIFY_TO?.trim() || "throwback@kissfm.nl";
  if (!host) return;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
    const lines = payload.songs.map((s, i) => `${i + 1}. ${s.artist} — ${s.title}${s.year ? ` (${s.year})` : ""}`);
    await transporter.sendMail({
      from,
      to,
      subject: `Nieuwe Throwback inzending: ${payload.companyName}`,
      text: [
        `Bedrijf: ${payload.companyName}`,
        `Contactpersoon: ${payload.contactName}`,
        `E-mail: ${payload.email}`,
        `Telefoon: ${payload.phone}`,
        `Audiobericht: ${payload.hasAudio ? "ja" : "nee"}`,
        `Videobericht: ${payload.hasVideo ? "ja" : "nee"}`,
        "",
        "Gekozen nummers:",
        ...lines,
      ].join("\n"),
    });
  } catch (error) {
    console.error("[throwback-mail] verzenden mislukt", error);
  }
}

export async function submitThrowbackPartySubmission(formData: FormData) {
  const honeypot = normalizeText(formData.get("website"));
  if (honeypot) throw new Error("Inzending geblokkeerd.");
  const startedAtRaw = Number(normalizeText(formData.get("startedAt")));
  if (Number.isFinite(startedAtRaw)) {
    const elapsed = Date.now() - startedAtRaw;
    if (elapsed < 2500) throw new Error("Te snel verzonden. Controleer je inzending opnieuw.");
  }

  const companyName = normalizeText(formData.get("companyName"));
  const contactName = normalizeText(formData.get("contactName"));
  const email = normalizeText(formData.get("email")).toLowerCase();
  const phone = normalizeText(formData.get("phone"));
  if (companyName.length < 2) throw new Error("Vul een geldige bedrijfsnaam in.");
  if (companyName.length > 120) throw new Error("Bedrijfsnaam is te lang.");
  if (!/^[a-zA-Z0-9À-ÿ\s\-&.,'()+/]+$/.test(companyName)) {
    throw new Error("Bedrijfsnaam bevat ongeldige tekens.");
  }
  if (contactName.length < 2 || contactName.length > 120) throw new Error("Vul een geldige contactpersoon in.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Vul een geldig e-mailadres in.");
  if (!/^[0-9+\-\s()]{7,25}$/.test(phone)) throw new Error("Vul een geldig telefoonnummer in.");
  const recentByCompany = await prisma.throwbackSubmission.count({
    where: {
      companyName: { equals: companyName, mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });
  if (recentByCompany >= 3) {
    throw new Error("Te veel recente inzendingen vanaf deze bedrijfsnaam. Probeer het later opnieuw.");
  }

  const selected = formData
    .getAll("songIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const songIds = Array.from(new Set(selected));
  const freeRaw = Number(normalizeText(formData.get("freeChoiceCount")));
  const freeChoiceCount = Number.isFinite(freeRaw) ? Math.max(0, Math.min(4, Math.trunc(freeRaw))) : 0;
  const totalCount = songIds.length + freeChoiceCount;
  if (totalCount < 6) throw new Error("Kies minimaal 6 nummers.");
  if (totalCount > 10) throw new Error("Kies maximaal 10 nummers.");

  const songs = await prisma.throwbackSong.findMany({
    where: { id: { in: songIds }, isActive: true },
    select: { id: true },
  });
  if (songs.length !== songIds.length) {
    throw new Error("Een of meer geselecteerde nummers zijn niet (meer) geldig.");
  }
  const allowed = new Set(songs.map((s) => s.id));
  const orderedValid = songIds.filter((id) => allowed.has(id));

  const freePicks: Array<{ artist: string; title: string; year: number | null }> = [];
  for (let i = 1; i <= freeChoiceCount; i++) {
    const artist = normalizeText(formData.get(`freeArtist_${i}`));
    const title = normalizeText(formData.get(`freeTitle_${i}`));
    const year = parseOptionalYearString(normalizeText(formData.get(`freeYear_${i}`)));
    if (artist.length < 1 || title.length < 1) {
      throw new Error("Vul alle vrije keuzes volledig in (artiest + titel).");
    }
    if (artist.length > 140 || title.length > 160) {
      throw new Error("Vrije keuze is te lang ingevuld.");
    }
    freePicks.push({ artist, title, year });
  }

  const teamPhotoPath = await saveTeamPhoto(pickUploadFromFormData(formData, "teamPhoto"));
  const audioMessagePath = await saveAudioMessage(pickUploadFromFormData(formData, "audioMessage"));
  const videoMessagePath = await saveVideoMessage(pickUploadFromFormData(formData, "videoMessage"));

  let createdSongRows: Array<{ artist: string; title: string; year: number | null }> = [];
  await prisma.$transaction(async (tx) => {
    const submission = await tx.throwbackSubmission.create({
      data: {
        companyName,
        contactName,
        email,
        phone,
        teamPhotoPath,
        audioMessagePath,
        videoMessagePath,
      },
      select: { id: true },
    });
    await tx.throwbackSubmissionSong.createMany({
      data: orderedValid.map((songId, index) => ({
        submissionId: submission.id,
        songId,
        rank: index + 1,
      })),
    });
    if (freePicks.length > 0) {
      await tx.throwbackSubmissionCustomSong.createMany({
        data: freePicks.map((p, idx) => ({
          submissionId: submission.id,
          artist: p.artist,
          title: p.title,
          year: p.year,
          rank: orderedValid.length + idx + 1,
        })),
      });
    }
    createdSongRows = await tx.throwbackSong.findMany({
      where: { id: { in: orderedValid } },
      select: { artist: true, title: true, year: true },
    });
  });

  const allForMail = [...createdSongRows, ...freePicks];
  await sendThrowbackNotificationEmail({
    companyName,
    contactName,
    email,
    phone,
    songs: allForMail,
    hasAudio: Boolean(audioMessagePath),
    hasVideo: Boolean(videoMessagePath),
  });

  revalidatePath("/admin/inzendingen");
  revalidatePath("/throwback");
  redirect("/throwback/gegevens?submitted=1");
}

export async function upsertThrowbackSong(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const id = normalizeText(formData.get("id"));
  const artist = normalizeText(formData.get("artist"));
  const title = normalizeText(formData.get("title"));
  const year = parseYear(formData.get("year"));
  let coverUrl = normalizeText(formData.get("coverUrl")) || null;
  const coverFile = pickUploadFromFormData(formData, "coverImageFile");
  const uploadedCover = coverFile ? await saveSongCoverImage(coverFile) : null;
  if (uploadedCover) coverUrl = uploadedCover;
  const sortOrder = parseSortOrder(formData.get("sortOrder"));
  const isActive = formData.get("isActive") === "on";

  if (!artist) throw new Error("Artiest is verplicht.");
  if (!title) throw new Error("Titel is verplicht.");
  if (!coverUrl) {
    const played = await prisma.playedTrack.findFirst({
      where: {
        artist: { equals: artist, mode: "insensitive" },
        title: { equals: title, mode: "insensitive" },
        cover: { not: null },
      },
      orderBy: { playedAt: "desc" },
      select: { cover: true },
    });
    coverUrl = String(played?.cover || "").trim() || null;
  }

  if (id) {
    await prisma.throwbackSong.update({
      where: { id },
      data: { artist, title, year, coverUrl, sortOrder, isActive },
    });
  } else {
    await prisma.throwbackSong.create({
      data: { artist, title, year, coverUrl, sortOrder, isActive },
    });
  }

  revalidatePath("/admin/acties");
  revalidatePath("/throwback");
}

export async function deleteThrowbackSong(songId: string) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const id = String(songId || "").trim();
  if (!id) throw new Error("Song-ID ontbreekt.");

  const linkedCount = await prisma.throwbackSubmissionSong.count({ where: { songId: id } });
  if (linkedCount > 0) {
    throw new Error("Dit nummer is al gebruikt in inzendingen en kan daarom niet verwijderd worden.");
  }

  await prisma.throwbackSong.delete({ where: { id } });
  revalidatePath("/admin/acties");
  revalidatePath("/throwback");
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function bestDelimiterFromLine(line: string) {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  for (const c of candidates) {
    const count = line.split(c).length;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

export async function importThrowbackSongsSheet(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);

  const file = pickUploadFromFormData(formData, "sheetFile");
  if (!file || file.size === 0) throw new Error("Upload een CSV-export van Google Sheets.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Sheet-bestand is te groot. Maximaal 10MB.");
  const text = Buffer.from(await file.arrayBuffer()).toString("utf8");
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("Geen regels gevonden in het bestand.");

  const delimiter = bestDelimiterFromLine(lines[0]);
  let parsed = lines.map((line) => parseDelimitedLine(line, delimiter));
  if (parsed.length > 0) {
    const first = parsed[0].map((v) => v.toLowerCase());
    const looksLikeHeader =
      first[0]?.includes("artiest") ||
      first[0]?.includes("artist") ||
      first[1]?.includes("titel") ||
      first[1]?.includes("nummer") ||
      first[1]?.includes("title") ||
      first[2]?.includes("jaar") ||
      first[2]?.includes("year");
    if (looksLikeHeader) parsed = parsed.slice(1);
  }

  const incoming: Array<{ artist: string; title: string; year: number | null; sortOrder: number }> = [];
  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    const artist = String(row[0] ?? "").trim();
    const title = String(row[1] ?? "").trim();
    const yearRaw = String(row[2] ?? "").trim();
    if (!artist || !title) continue;
    const yearParsed = yearRaw ? Number(yearRaw) : NaN;
    const year = Number.isFinite(yearParsed) ? Math.max(1950, Math.min(2100, Math.trunc(yearParsed))) : null;
    incoming.push({ artist, title, year, sortOrder: i });
  }
  if (incoming.length === 0) {
    throw new Error("Geen geldige regels gevonden. Verwacht: kolom A=artiest, B=titel, C=jaartal.");
  }

  const existing = await prisma.throwbackSong.findMany({
    select: { artist: true, title: true, year: true },
  });
  const playedRows = await prisma.playedTrack.findMany({
    where: { cover: { not: null } },
    orderBy: { playedAt: "desc" },
    take: 4000,
    select: { artist: true, title: true, cover: true },
  });
  const playedCoverByKey = new Map<string, string>();
  for (const row of playedRows) {
    const cover = String(row.cover || "").trim();
    if (!cover) continue;
    const key = `${normalizeTrackKey(row.artist)}|${normalizeTrackKey(row.title)}`;
    if (!playedCoverByKey.has(key)) playedCoverByKey.set(key, cover);
  }
  const existingKeys = new Set(
    existing.map((s) => `${s.artist.trim().toLowerCase()}|${s.title.trim().toLowerCase()}|${s.year ?? ""}`)
  );
  const toCreate = incoming.filter((row) => {
    const key = `${row.artist.toLowerCase()}|${row.title.toLowerCase()}|${row.year ?? ""}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });

  if (toCreate.length > 0) {
    await prisma.throwbackSong.createMany({
      data: toCreate.map((r) => ({
        artist: r.artist,
        title: r.title,
        year: r.year,
        coverUrl: playedCoverByKey.get(`${normalizeTrackKey(r.artist)}|${normalizeTrackKey(r.title)}`) || null,
        sortOrder: r.sortOrder,
        isActive: true,
      })),
    });
  }

  revalidatePath("/admin/acties");
  revalidatePath("/throwback");
}

export async function uploadThrowbackActionImage(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const file = pickUploadFromFormData(formData, "imageFile");
  const imagePath = await saveActionImage(file);
  await prisma.siteSetting.upsert({
    where: { key: "ACTION_THROWBACK_IMAGE_PATH" },
    create: { key: "ACTION_THROWBACK_IMAGE_PATH", value: imagePath },
    update: { value: imagePath },
  });
  revalidatePath("/admin/acties");
  revalidatePath("/");
  revalidatePath("/acties");
}

export async function backfillThrowbackSongCovers() {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const songs = await prisma.throwbackSong.findMany({
    where: { coverUrl: null },
    select: { id: true, artist: true, title: true },
  });
  if (songs.length === 0) return;
  const playedRows = await prisma.playedTrack.findMany({
    where: { cover: { not: null } },
    orderBy: { playedAt: "desc" },
    take: 6000,
    select: { artist: true, title: true, cover: true },
  });
  const playedCoverByKey = new Map<string, string>();
  for (const row of playedRows) {
    const cover = String(row.cover || "").trim();
    if (!cover) continue;
    const key = `${normalizeTrackKey(row.artist)}|${normalizeTrackKey(row.title)}`;
    if (!playedCoverByKey.has(key)) playedCoverByKey.set(key, cover);
  }
  for (const song of songs) {
    const key = `${normalizeTrackKey(song.artist)}|${normalizeTrackKey(song.title)}`;
    const coverUrl = playedCoverByKey.get(key);
    if (!coverUrl) continue;
    await prisma.throwbackSong.update({ where: { id: song.id }, data: { coverUrl } });
  }
  revalidatePath("/admin/acties");
  revalidatePath("/throwback");
}

export async function updateThrowbackSubmissionStatus(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertAdmin(session);
  const id = normalizeText(formData.get("id"));
  const statusRaw = normalizeText(formData.get("status")).toUpperCase();
  const status = statusRaw === "APPROVED" || statusRaw === "REJECTED" ? statusRaw : "PENDING";
  if (!id) throw new Error("Inzending-ID ontbreekt.");
  await prisma.throwbackSubmission.update({ where: { id }, data: { status } });
  revalidatePath("/admin/inzendingen");
}
