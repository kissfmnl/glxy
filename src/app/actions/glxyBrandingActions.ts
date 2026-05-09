"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
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

export async function updateBrandingAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  await requireAdmin();

  const primaryHex = normalizeHex(String(formData.get("primaryHex")), "#0b7557");
  const accentHex = normalizeHex(String(formData.get("accentHex")), "#6d6d6d");
  const navyHex = normalizeHex(String(formData.get("navyHex")), "#363636");
  const yellowHex = normalizeHex(String(formData.get("yellowHex")), "#ffe200");
  const logoUrl = normalizeUrl(String(formData.get("logoUrl") ?? ""));
  const faviconUrl = normalizeUrl(String(formData.get("faviconUrl") ?? ""));
  const instagramUrl = normalizeUrl(String(formData.get("instagramUrl") ?? ""));
  const tiktokUrl = normalizeUrl(String(formData.get("tiktokUrl") ?? ""));
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
  const defaultM3 =
    "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8";
  const hlsFinal =
    !homeHlsUrl || homeHlsUrl.startsWith("https://") || homeHlsUrl.startsWith("http://") ? homeHlsUrl || defaultM3 : defaultM3;

  await prisma.branding.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      primaryHex,
      accentHex,
      navyHex,
      yellowHex,
      logoUrl,
      faviconUrl,
      instagramUrl,
      tiktokUrl,
      navItems: navItems ?? undefined,
      stationColors: stationColors ?? undefined,
      homeHlsUrl: hlsFinal,
    },
    update: {
      primaryHex,
      accentHex,
      navyHex,
      yellowHex,
      logoUrl,
      faviconUrl,
      instagramUrl,
      tiktokUrl,
      navItems: navItems ?? undefined,
      stationColors: stationColors ?? undefined,
      homeHlsUrl: hlsFinal,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/branding");
  return { ok: true };
}
