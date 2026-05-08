import type { Session } from "next-auth";

export const PORTAL_PERMISSION_LABELS = {
  whatsapp: "WhatsApp inbox",
  studioBeta: "Studio reservering 2.0 (beta)",
  manageUsers: "Gebruikers beheren",
  manageDjs: "DJ's beheren",
  manageStudioLegacy: "Studio reservering (oud)",
  manageSiteSettings: "Site instellingen",
  manageFiles: "Bestanden",
  manageVisitors: "Bezoekers",
  managePlaylistVotes: "Playlist stemmen",
  manageDeveloper: "Developer",
  manageKiss40: "KISS40 beheren",
  editOwnJockProfile: "Eigen DJ-profiel / fun facts",
} as const;

export type PortalPermissionKey = keyof typeof PORTAL_PERMISSION_LABELS;

export const PORTAL_PERMISSION_KEYS = Object.keys(PORTAL_PERMISSION_LABELS) as PortalPermissionKey[];

export const DEFAULT_DJ_PERMISSIONS: PortalPermissionKey[] = [
  "studioBeta",
  "editOwnJockProfile",
];

export function normalizePortalPermissions(input: unknown): PortalPermissionKey[] {
  if (!Array.isArray(input)) return [];
  return input.filter((v): v is PortalPermissionKey => typeof v === "string" && PORTAL_PERMISSION_KEYS.includes(v as PortalPermissionKey));
}

export function parsePortalPermissionsJson(raw: string | null | undefined): PortalPermissionKey[] {
  const text = String(raw || "").trim();
  if (!text) return [];
  try {
    return normalizePortalPermissions(JSON.parse(text));
  } catch {
    return [];
  }
}

export function serializePortalPermissions(perms: PortalPermissionKey[]): string {
  const deduped = Array.from(new Set(normalizePortalPermissions(perms)));
  deduped.sort((a, b) => PORTAL_PERMISSION_KEYS.indexOf(a) - PORTAL_PERMISSION_KEYS.indexOf(b));
  return JSON.stringify(deduped);
}

export function hasPortalPermission(session: Session | null, key: PortalPermissionKey): boolean {
  const u = session?.user as { role?: string; portalPermissions?: unknown } | undefined;
  if (!u) return false;
  const perms = normalizePortalPermissions(u.portalPermissions);
  return perms.includes(key);
}
