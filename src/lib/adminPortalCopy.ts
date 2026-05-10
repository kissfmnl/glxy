export type AdminPortalCopy = {
  stationsIntroHtml?: string;
  brandingIntroHtml?: string;
  playerUiIntroHtml?: string;
};

export const DEFAULT_ADMIN_PORTAL_COPY: Required<AdminPortalCopy> = {
  stationsIntroHtml: `Beheer wat op de homepage onder de live-video staat: streams, logo’s, nu-speelt-tekstbestanden en kaartkleuren. <a href="/admin/player-ui">Player &amp; weergave</a> voor kleuren van knoppen en de vaste mini-player.`,
  brandingIntroHtml: `Publieke GLXY-site: kleuren via CSS-variabelen, optioneel logo in de header, favicon, en de HLS-embed op de homepage.`,
  playerUiIntroHtml: `Kleuren voor de zenderkaarten op de homepage, de vaste mini-player onderaan, en de bediening van de live-video. Staat los van <a href="/admin/branding">Huisstijl</a>.`,
};

export function mergeAdminPortalCopy(fromDb: unknown): Required<AdminPortalCopy> {
  const base = { ...DEFAULT_ADMIN_PORTAL_COPY };
  if (!fromDb || typeof fromDb !== "object" || Array.isArray(fromDb)) return base;
  const o = fromDb as Record<string, unknown>;
  if (typeof o.stationsIntroHtml === "string") base.stationsIntroHtml = o.stationsIntroHtml;
  if (typeof o.brandingIntroHtml === "string") base.brandingIntroHtml = o.brandingIntroHtml;
  if (typeof o.playerUiIntroHtml === "string") base.playerUiIntroHtml = o.playerUiIntroHtml;
  return base;
}
