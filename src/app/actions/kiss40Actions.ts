"use server";

import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAccessKiss40 } from "@/lib/kiss40Access";
import * as XLSX from "xlsx";

function assertKiss40(session: Session | null) {
  if (!canAccessKiss40(session)) throw new Error("Niet geautoriseerd");
}

function startOfUtcMonday(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}

function getIsoWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function createKiss40DraftWeek() {
  const session = await getServerSession(authOptions);
  assertKiss40(session);
  let d = startOfUtcMonday(new Date());
  for (let i = 0; i < 104; i++) {
    const existing = await prisma.kiss40Week.findUnique({ where: { weekStart: d } });
    if (!existing) {
      const prev = await prisma.kiss40Week.findFirst({
        where: { weekStart: { lt: d } },
        orderBy: { weekStart: "desc" },
        select: { tracksJson: true },
      });
      const w = await prisma.kiss40Week.create({
        data: {
          weekStart: d,
          title: `KISS40 — week ${getIsoWeekNumber(d)}`,
          status: "draft",
          tracksJson: prev?.tracksJson?.trim() || "[]",
        },
      });
      revalidatePath("/settings/kiss40");
      redirect(`/settings/kiss40/${w.id}`);
    }
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 7);
    d = next;
  }
  throw new Error("Geen vrije weekslot gevonden.");
}

export async function deleteKiss40Week(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertKiss40(session);
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Ontbrekend id.");

  await prisma.kiss40Week.delete({ where: { id } });
  revalidatePath("/settings/kiss40");
  redirect("/settings/kiss40?deleted=1");
}

export async function updateKiss40Week(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertKiss40(session);
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Ontbrekend id.");
  const title = String(formData.get("title") || "").trim();
  const status = String(formData.get("status") || "draft").trim();
  const tracksJsonRaw = String(formData.get("tracksJson") || "").trim() || "[]";
  const notes = String(formData.get("notes") || "").trim();
  if (status !== "draft" && status !== "published") {
    throw new Error("Ongeldige status.");
  }
  try {
    const parsed = JSON.parse(tracksJsonRaw);
    if (!Array.isArray(parsed)) throw new Error("Tracklijst is geen geldige JSON-array.");
    if (parsed.length !== 40) throw new Error(`KISS40 moet exact 40 nummers bevatten (nu: ${parsed.length}).`);
    await prisma.kiss40Week.update({
      where: { id },
      data: { title, status, tracksJson: tracksJsonRaw, notes },
    });
    revalidatePath("/settings/kiss40");
    revalidatePath(`/settings/kiss40/${id}`);
    redirect(`/settings/kiss40/${id}?saved=1`);
  } catch (e: any) {
    if (isNextRedirectError(e)) throw e;
    const msg = String(e?.message || "Opslaan mislukt.");
    redirect(`/settings/kiss40/${id}?saveError=${encodeURIComponent(msg)}`);
  }
}

function normalizeHeader(input: unknown): string {
  return String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

function parseIntOrNull(v: unknown): number | null {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function pickHeaderRow(rows: any[][]): { headerRowIndex: number; headers: string[] } {
  let bestIdx = 0;
  let bestScore = -1;
  let bestHeaders: string[] = [];

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const headers = (rows[i] || []).map((h) => normalizeHeader(h));
    const hasDw = headers.some((h) => h === "dw" || h === "dezeweek" || h === "thisweek");
    const hasArtist = headers.some((h) => h === "artiest" || h === "artist");
    const hasTitle = headers.some((h) => h === "titel" || h === "title");
    const score = Number(hasDw) + Number(hasArtist) + Number(hasTitle);
    if (score > bestScore) {
      bestIdx = i;
      bestScore = score;
      bestHeaders = headers;
    }
    if (score === 3) break;
  }

  return { headerRowIndex: bestIdx, headers: bestHeaders };
}

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function importKiss40FromXlsx(formData: FormData) {
  const session = await getServerSession(authOptions);
  assertKiss40(session);

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Ontbrekend id.");

  const file = (formData.get("xlsxFile") as File | null) || null;
  if (!file || file.size === 0) throw new Error("Geen XLSX-bestand gekozen.");

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) throw new Error("Leeg spreadsheet.");
  const ws = wb.Sheets[firstSheetName];
  try {
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    if (rows.length < 2) throw new Error("Spreadsheet bevat geen datarijen.");

    const { headerRowIndex, headers } = pickHeaderRow(rows);
    const findCol = (variants: string[]) =>
      headers.findIndex((h) => variants.some((v) => h === v || h.includes(v)));
    const col = {
      dw: findCol(["dw", "dezeweek", "thisweek"]),
      vw: findCol(["vw", "vorigeweek", "lastweek"]),
      aw: findCol(["aw", "aantalweken", "weeks"]),
      sts: findCol(["sts", "stijgingdaling", "status"]),
      artist: findCol(["artiest", "artist", "artiestnaam", "artists"]),
      title: findCol(["titel", "title", "tracktitel", "songtitle"]),
    };
    if (col.dw < 0 || col.artist < 0 || col.title < 0) {
      throw new Error("Kolommen DW, Artiest en Titel zijn verplicht in XLSX.");
    }

    const tracks = rows
      .slice(headerRowIndex + 1)
      .map((r) => {
        const dw = parseIntOrNull(r[col.dw]);
        const vw = col.vw >= 0 ? parseIntOrNull(r[col.vw]) : null;
        const awRaw = col.aw >= 0 ? String(r[col.aw] ?? "").trim().toUpperCase() : "";
        const aw = awRaw === "NEW" ? "NEW" : parseIntOrNull(awRaw);
        const sts = col.sts >= 0 ? String(r[col.sts] ?? "").trim() : "";
        const artist = String(r[col.artist] ?? "").trim();
        const title = String(r[col.title] ?? "").trim();
        if (!dw || !artist || !title) return null;
        return { dw, vw, aw, sts, artist, title };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.dw - b.dw);

    if (tracks.length === 0) throw new Error("Geen geldige tracks gevonden in XLSX.");

    await prisma.kiss40Week.update({
      where: { id },
      data: {
        tracksJson: JSON.stringify(tracks),
        notes: `Geimporteerd uit XLSX (${file.name}) op ${new Date().toISOString()}`,
      },
    });
    revalidatePath("/settings/kiss40");
    revalidatePath(`/settings/kiss40/${id}`);
    redirect(`/settings/kiss40/${id}?saved=1`);
  } catch (e: any) {
    if (isNextRedirectError(e)) throw e;
    const msg = String(e?.message || "XLSX import mislukt.");
    redirect(`/settings/kiss40/${id}?importError=${encodeURIComponent(msg)}`);
  }
}
