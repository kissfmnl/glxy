export type HomepageUiSettingItem = {
  key: string;
  label: string;
  fallback: string;
  type?: "text" | "textarea" | "select";
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  section: string;
};

export const HOMEPAGE_UI_SETTINGS: HomepageUiSettingItem[] = [
  { key: "HOME_SHOW_LIPS_LOGO", label: "Hero: KISS lippen tonen", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Hero" },
  { key: "HOME_PANEL_CURRENT_SHOW", label: "Panel: Nu op zender", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Panels" },
  { key: "HOME_PANEL_RECENT_TRACKS", label: "Panel: Laatste tracks", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Panels" },
  { key: "HOME_PANEL_CONCERTS", label: "Panel: Concerten", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Panels" },
  { key: "HOME_PANEL_ACTIONS", label: "Panel: Acties", fallback: "no", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Panels" },
  { key: "HOME_PANEL_VOICES", label: "Panel: DJ-kolom rechts", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Panels" },
  { key: "HOME_PANEL_INSTAGRAM", label: "Panel: Instagram", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Panels" },
  { key: "HOME_PANEL_TIKTOK", label: "Panel: TikTok", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Panels" },
  {
    key: "HOME_VOICES_PHOTO_COUNT",
    label: "Onze DJ's: aantal foto's",
    fallback: "auto",
    type: "select",
    options: [
      { value: "auto", label: "Automatisch" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
      { value: "7", label: "7" },
      { value: "8", label: "8" },
      { value: "9", label: "9" },
      { value: "10", label: "10" },
    ],
    section: "Panels",
  },
  { key: "HOME_INSTAGRAM_PANEL_TITLE", label: "Instagram panel titel", fallback: "Instagram", section: "Panels" },
  { key: "HOME_TIKTOK_PANEL_TITLE", label: "TikTok panel titel", fallback: "TikTok", section: "Panels" },
  { key: "HOME_INSTAGRAM_PROFILE_URL", label: "Instagram profiel URL", fallback: "https://instagram.com/kissfmnl", section: "Panels" },
  { key: "HOME_TIKTOK_PROFILE_URL", label: "TikTok profiel URL", fallback: "https://www.tiktok.com/@kissfmnl", section: "Panels" },
  { key: "HOME_INSTAGRAM_EMBED_HTML", label: "Instagram embed code (optioneel)", fallback: "", type: "textarea", rows: 6, section: "Panels" },
  { key: "HOME_TIKTOK_EMBED_HTML", label: "TikTok embed code (optioneel)", fallback: "", type: "textarea", rows: 6, section: "Panels" },
  { key: "HOME_INSTAGRAM_POST_URL", label: "Instagram laatste post URL (alternatief embed)", fallback: "", section: "Panels" },
  { key: "HOME_TIKTOK_POST_URL", label: "TikTok laatste video URL (alternatief embed)", fallback: "", section: "Panels" },
  { key: "NAV_SHOW_HOME", label: "Navigatie: Home", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
  { key: "NAV_SHOW_PLAYLIST", label: "Navigatie: Playlist", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
  { key: "NAV_SHOW_PROGRAMMERING", label: "Navigatie: Programmering", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
  { key: "NAV_SHOW_DJS", label: "Navigatie: DJ's", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
  { key: "NAV_SHOW_KISS40", label: "Navigatie: KISS40", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
  { key: "NAV_SHOW_FREQUENTIES", label: "Navigatie: Frequenties", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
  { key: "NAV_SHOW_JOIN_KISS", label: "Navigatie: Join KISS", fallback: "yes", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
  { key: "NAV_SHOW_ACTIES", label: "Navigatie: Acties", fallback: "no", type: "select", options: [{ value: "yes", label: "Tonen" }, { value: "no", label: "Verbergen" }], section: "Navigatie" },
];

export const HOMEPAGE_UI_KEYS = HOMEPAGE_UI_SETTINGS.map((i) => i.key);
