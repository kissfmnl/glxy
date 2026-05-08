export type SiteGeneralSettingItem = {
  key: string;
  label: string;
  fallback: string;
  type?: "text" | "textarea" | "select";
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  section: string;
};

export const SITE_GENERAL_SETTINGS: SiteGeneralSettingItem[] = [
  { key: "PUBLIC_TAB_TITLE", label: "Browser-tab titel (website)", fallback: "KISS FM", section: "Algemeen" },
  { key: "SITE_FAVICON_PATH", label: "Favicon pad", fallback: "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png", section: "Favicon" },
  { key: "HOME_APP_POPUP_SHOW", label: "Popup: Download de app", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "App popup" },
  { key: "HOME_APP_POPUP_TITLE", label: "Popup titel", fallback: "Download de KISS FM app", section: "App popup" },
  { key: "HOME_APP_POPUP_BODY", label: "Popup tekst", fallback: "Luister live, stem op de KISS40 en mis geen hit.", type: "textarea", rows: 2, section: "App popup" },
  { key: "HOME_APP_POPUP_URL", label: "Popup knop URL", fallback: "/frequenties", section: "App popup" },
  { key: "HOME_APP_POPUP_CTA", label: "Popup knop tekst", fallback: "Open app links", section: "App popup" },
  { key: "COOKIE_BANNER_SHOW", label: "Cookie melding tonen", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Cookie melding" },
  { key: "COOKIE_BANNER_TEXT", label: "Cookie melding tekst", fallback: "Wij gebruiken alleen functionele cookies om de site goed te laten werken.", type: "textarea", rows: 2, section: "Cookie melding" },
  { key: "COOKIE_BANNER_CTA", label: "Cookie knop tekst", fallback: "Ok, begrepen", section: "Cookie melding" },
  { key: "FALLBACK_ALBUM_LOGO_PATH", label: "Fallback album-cover logo", fallback: "Website/Logo/KISS - Lippen (groen)_transparant (1) (4).png", section: "Fallback album cover" },
  { key: "FALLBACK_ALBUM_BG_COLOR", label: "Fallback album-cover achtergrondkleur (#hex)", fallback: "#f2f8fb", section: "Fallback album cover" },
];

export const SITE_GENERAL_KEYS = SITE_GENERAL_SETTINGS.map((i) => i.key);
