"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPortalAdmin } from "@/lib/authRoles";
import { mergeFooterConfig, type FooterConfigInput } from "@/lib/footerConfig";

function normalizeHttpOrMailto(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("mailto:") || s.startsWith("https://") || s.startsWith("http://") || s.startsWith("/")) return s;
  if (s.includes("@") && !s.includes(" ")) return `mailto:${s}`;
  return null;
}

function normalizeWhatsapp(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const asLink = normalizeHttpOrMailto(s);
  if (asLink) return asLink;
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) return `https://wa.me/${digits}`;
  return null;
}

function normalizeOptionalHex(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let t = s.startsWith("#") ? s : `#${s}`;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (!m) return null;
  return `#${m[1]!.length === 3 ? m[1]!.split("").map((c) => c + c).join("") : m[1]!}`.toLowerCase();
}

export async function updateFooterBrandingAction(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) {
    return { error: "Geen rechten." };
  }

  const input: FooterConfigInput = {
    bgHex: normalizeOptionalHex(String(formData.get("footerBgHex") ?? "")) ?? undefined,
    iconHex: normalizeOptionalHex(String(formData.get("footerIconHex") ?? "")) ?? undefined,
    logoUrl: String(formData.get("footerLogoUrl") ?? "").trim() || null,
    whatsappUrl: normalizeWhatsapp(String(formData.get("footerWhatsappUrl") ?? "")),
    tiktokUrl: normalizeHttpOrMailto(String(formData.get("footerTiktokUrl") ?? "")),
    instagramUrl: normalizeHttpOrMailto(String(formData.get("footerInstagramUrl") ?? "")),
    youtubeUrl: normalizeHttpOrMailto(String(formData.get("footerYoutubeUrl") ?? "")),
    twitchUrl: normalizeHttpOrMailto(String(formData.get("footerTwitchUrl") ?? "")),
    mailUrl: normalizeHttpOrMailto(String(formData.get("footerMailUrl") ?? "")),
  };

  const merged = mergeFooterConfig(input as unknown);

  try {
    await prisma.branding.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        footerConfig: merged as object,
      },
      update: {
        footerConfig: merged as object,
      },
    });
  } catch {
    return { error: "Opslaan mislukt." };
  }

  revalidatePath("/");
  revalidatePath("/admin/footer");
  return { ok: true };
}
