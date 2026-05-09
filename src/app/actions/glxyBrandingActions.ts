"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { KEEP_STATION_LOGO } from "@/lib/glxyStations";
import { MAX_IMAGE_DATA_URI_CHARS, inlineApiMediaUrlIfLocal } from "@/lib/inlineMediaFromApiUrl";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Geen rechten.");
  }
}

function normalizeHex(hex: string, fallback: string) {
  let t = hex.trim();
  if (t && !t.startsWith("#")) t = `#${t}`;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (!m) return fallback;
  return `#${m[1]!.length === 3 ? m[1]!.split("").map((c) => c + c).join("") : m[1]!}`.toLowerCase();
}

function normalizeUrl(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  return null;
}

function normalizeOptionalHex(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  let t = s;
  if (t && !t.startsWith("#")) t = `#${t}`;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (!m) return null;
  return `#${m[1]!.length === 3 ? m[1]!.split("").map((c) => c + c).join("") : m[1]!}`.toLowerCase();
}

async function resolveLogoFields(
  formData: FormData,
  prev: { logoUrl: string | null; logoDataUri: string | null } | null,
): Promise<{ logoUrl: string | null; logoDataUri: string | null }> {
  const logoEmbeddedMarker = formData.get("logoEmbeddedMarker") === "1";
  const clearMainLogo = formData.get("clearMainLogo") === "1";
  const logoUrlRaw = String(formData.get("logoUrl") ?? "").trim();

  if (clearMainLogo) {
    return { logoUrl: null, logoDataUri: null };
  }
  if (logoEmbeddedMarker && !logoUrlRaw) {
    return {
      logoUrl: prev?.logoUrl ?? null,
      logoDataUri: prev?.logoDataUri ?? null,
    };
  }
  if (!logoUrlRaw) {
    return { logoUrl: null, logoDataUri: null };
  }
  if (logoUrlRaw.startsWith("/api/media/")) {
    const inlined = await inlineApiMediaUrlIfLocal(logoUrlRaw);
    if (inlined?.startsWith("data:image/")) {
      return { logoUrl: null, logoDataUri: inlined };
    }
    return { logoUrl: logoUrlRaw, logoDataUri: null };
  }
  if (logoUrlRaw.startsWith("data:image/")) {
    if (logoUrlRaw.length <= MAX_IMAGE_DATA_URI_CHARS) {
      return { logoUrl: null, logoDataUri: logoUrlRaw };
    }
    return { logoUrl: prev?.logoUrl ?? null, logoDataUri: prev?.logoDataUri ?? null };
  }
  return { logoUrl: normalizeUrl(logoUrlRaw), logoDataUri: null };
}

async function mergeStationsConfig(raw: string, prevConfig: unknown): Promise<object[] | undefined> {
  let incoming: unknown;
  try {
    incoming = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!Array.isArray(incoming)) return undefined;
  const prevArr = Array.isArray(prevConfig) ? prevConfig : [];
  const prevById = new Map<string, { logoUrl?: string }>();
  for (const p of prevArr) {
    if (p && typeof p === "object" && typeof (p as { id?: string }).id === "string") {
      prevById.set(String((p as { id: string }).id), p as { logoUrl?: string });
    }
  }
  const out: object[] = [];
  for (const inc of incoming) {
    if (!inc || typeof inc !== "object") continue;
    const id = String((inc as { id?: string }).id ?? "").trim();
    if (!id) continue;
    const prevSt = prevById.get(id);
    let logoUrlStation = String((inc as { logoUrl?: string }).logoUrl ?? "").trim();
    if (logoUrlStation === KEEP_STATION_LOGO) {
      logoUrlStation = typeof prevSt?.logoUrl === "string" ? prevSt.logoUrl : "";
    }
    if (logoUrlStation.startsWith("/api/media/")) {
      const inlined = await inlineApiMediaUrlIfLocal(logoUrlStation);
      if (inlined?.startsWith("data:image/")) logoUrlStation = inlined;
    }
    const line1 = String((inc as { line1?: string }).line1 ?? "").trim();
    const line2 = String((inc as { line2?: string }).line2 ?? "").trim();
    const streamUrl = String((inc as { streamUrl?: string }).streamUrl ?? "").trim();
    const row: Record<string, unknown> = { id, line1, line2, streamUrl };
    if (logoUrlStation) row.logoUrl = logoUrlStation;
    out.push(row);
  }
  return out;
}

export async function updateBrandingAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  await requireAdmin();

  const primaryHex = normalizeHex(String(formData.get("primaryHex")), "#0b7557");
  const accentHex = normalizeHex(String(formData.get("accentHex")), "#6d6d6d");
  const navyHex = normalizeHex(String(formData.get("navyHex")), "#363636");
  const yellowHex = normalizeHex(String(formData.get("yellowHex")), "#ffe200");
  const faviconUrl = normalizeUrl(String(formData.get("faviconUrl") ?? ""));
  const instagramUrl = normalizeUrl(String(formData.get("instagramUrl") ?? ""));
  const tiktokUrl = normalizeUrl(String(formData.get("tiktokUrl") ?? ""));
  const menuBarHex = normalizeOptionalHex(String(formData.get("menuBarHex") ?? ""));
  const heroVideoFrameHex = normalizeOptionalHex(String(formData.get("heroVideoFrameHex") ?? ""));
  const listenBarBgHex = normalizeOptionalHex(String(formData.get("listenBarBgHex") ?? ""));
  const listenBarTextHex = normalizeOptionalHex(String(formData.get("listenBarTextHex") ?? ""));
  let stationColors: Record<string, any> | null = null;
  try {
    const raw = String(formData.get("stationColorsJson") ?? "").trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        stationColors = parsed as Record<string, any>;
      }
    }
  } catch {
    stationColors = null;
  }
  let navItems: Array<{ href: string; label: string }> | null = null;
  try {
    const raw = String(formData.get("navItemsJson") ?? "").trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        navItems = parsed
          .filter((x) => x && typeof x.href === "string" && typeof x.label === "string")
          .map((x) => ({ href: String(x.href).trim(), label: String(x.label).trim() }))
          .filter((x) => x.href && x.label);
      }
    }
  } catch {
    navItems = null;
  }
  const homeHlsUrl = String(formData.get("homeHlsUrl") ?? "").trim();
  const defaultM3 = "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8";
  const hlsFinal =
    !homeHlsUrl || homeHlsUrl.startsWith("https://") || homeHlsUrl.startsWith("http://") ? homeHlsUrl || defaultM3 : defaultM3;

  const prev = await prisma.branding.findUnique({ where: { id: 1 } });
  const { logoUrl, logoDataUri } = await resolveLogoFields(formData, prev);

  const stationsRaw = String(formData.get("stationsJson") ?? "").trim();
  const stationsMerged = stationsRaw ? await mergeStationsConfig(stationsRaw, prev?.stationsConfig) : undefined;

  await prisma.branding.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      primaryHex,
      accentHex,
      navyHex,
      yellowHex,
      logoUrl,
      logoDataUri,
      faviconUrl,
      instagramUrl,
      tiktokUrl,
      menuBarHex,
      heroVideoFrameHex,
      listenBarBgHex,
      listenBarTextHex,
      navItems: navItems ?? undefined,
      stationColors: stationColors ?? undefined,
      stationsConfig: stationsMerged ?? undefined,
      homeHlsUrl: hlsFinal,
    },
    update: {
      primaryHex,
      accentHex,
      navyHex,
      yellowHex,
      logoUrl,
      logoDataUri,
      faviconUrl,
      instagramUrl,
      tiktokUrl,
      menuBarHex,
      heroVideoFrameHex,
      listenBarBgHex,
      listenBarTextHex,
      navItems: navItems ?? undefined,
      stationColors: stationColors ?? undefined,
      ...(stationsMerged !== undefined ? { stationsConfig: stationsMerged } : {}),
      homeHlsUrl: hlsFinal,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/branding");
  return { ok: true };
}
