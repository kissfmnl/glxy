/**
 * Public site base URL (no trailing slash). Used for uitnodigingslinks.
 * In productie: zet `NEXTAUTH_URL` op je Railway-service (canonical HTTPS-URL).
 */
export function getPublicAppUrl(): string {
  const explicit = process.env.NEXTAUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    const host = railwayDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}
