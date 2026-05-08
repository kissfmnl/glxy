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
  const t = hex.trim();
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

  const primaryHex = normalizeHex(String(formData.get("primaryHex")), "#22d3ee");
  const accentHex = normalizeHex(String(formData.get("accentHex")), "#c084fc");
  const navyHex = normalizeHex(String(formData.get("navyHex")), "#0f172a");
  const logoUrl = normalizeUrl(String(formData.get("logoUrl") ?? ""));
  const faviconUrl = normalizeUrl(String(formData.get("faviconUrl") ?? ""));
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
      logoUrl,
      faviconUrl,
      homeHlsUrl: hlsFinal,
    },
    update: {
      primaryHex,
      accentHex,
      navyHex,
      logoUrl,
      faviconUrl,
      homeHlsUrl: hlsFinal,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/branding");
  return { ok: true };
}
