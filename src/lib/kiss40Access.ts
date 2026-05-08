import type { Session } from "next-auth";
import { normalizePortalPermissions } from "@/lib/portalPermissions";

function allowlist(): string[] {
  const raw = process.env.KISS40_EDITOR_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
}

/** E-mail staat in KISS40_EDITOR_EMAILS (komma/spatie gescheiden). */
export function isKiss40EditorEmail(email: string | null | undefined): boolean {
  const e = email?.toLowerCase().trim();
  if (!e) return false;
  return allowlist().includes(e);
}

export function canAccessKiss40(session: Session | null): boolean {
  const u = session?.user as { role?: string; email?: string | null; portalPermissions?: unknown } | undefined;
  if (!u) return false;
  if (u.role === "ADMIN") return true;
  const perms = normalizePortalPermissions(u.portalPermissions);
  if (perms.includes("manageKiss40")) return true;
  return isKiss40EditorEmail(u.email ?? null);
}
