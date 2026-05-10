import type { Role } from "@prisma/client";

export function isPortalAdmin(role: Role | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: Role | undefined): boolean {
  return role === "SUPER_ADMIN";
}
