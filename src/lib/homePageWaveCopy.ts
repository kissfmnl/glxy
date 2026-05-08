import { prisma } from "@/lib/prisma";
import { amsterdamMinutesOfDay, formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { normalizeHeroColorInput } from "@/lib/heroTitleColor";
import { pickHomeHeroHeadlineSlot } from "@/lib/pickHomeHeroHeadlineSlot";
import { websiteTextGroups, type WebsiteTextItem } from "@/lib/websiteTextsConfig";
import { HOMEPAGE_UI_KEYS } from "@/lib/homepageUiSettingsConfig";

const homepageItems = websiteTextGroups.find((g) => g.page === "Homepagina")!.items;
const fallbackMap = Object.fromEntries(homepageItems.map((i) => [i.key, i.fallback]));

export type HeroTitleColor = "white" | "teal";

export type HeroTitleLayout = "inline" | "stacked";

export type HomeWaveCopy = {
  showHeroKicker: boolean;
  heroKicker: string;
  showPolaroids: boolean;
  /** Horizontaal schuivende rijen in de collage (admin: Homepagina). */
  heroBackdropMotion: boolean;
  heroTitle1: string;
  /** `white`, `teal` of `#rrggbb` (geplande titels). */
  heroTitle1Color: string;
  heroTitle2: string;
  heroTitle2Color: string;
  heroTitleLayout: HeroTitleLayout;
  heroSubtitle: string;
  sidebarTitle: string;
  nowLabel: string;
  nextLabel: string;
  liveLabel: string;
  recentTracksTitle: string;
  recentTracksCta: string;
  currentShowTitle: string;
  currentShowCta: string;
  concertsTitle: string;
  showLipsLogo: boolean;
  showCurrentShowPanel: boolean;
  showRecentTracksPanel: boolean;
  showConcertsPanel: boolean;
  showActionsPanel: boolean;
  showVoicesPanel: boolean;
  showInstagramPanel: boolean;
  showTikTokPanel: boolean;
  voicesPhotoCount: number | null;
  instagramPanelTitle: string;
  tiktokPanelTitle: string;
  instagramProfileUrl: string;
  tiktokProfileUrl: string;
  instagramEmbedHtml: string;
  tiktokEmbedHtml: string;
  instagramPostUrl: string;
  tiktokPostUrl: string;
  showAppPopup: boolean;
  appPopupTitle: string;
  appPopupBody: string;
  appPopupUrl: string;
  appPopupCta: string;
  showCookieBanner: boolean;
  cookieBannerText: string;
  cookieBannerCta: string;
};

function clean(map: Map<string, string>, key: string) {
  const raw = (map.get(key) ?? "").trim();
  return raw || fallbackMap[key] || "";
}

function titleColor(map: Map<string, string>, key: string, fallback: HeroTitleColor): HeroTitleColor {
  const v = (map.get(key) ?? fallback).trim().toLowerCase();
  return v === "teal" ? "teal" : "white";
}

function titleLayout(map: Map<string, string>): HeroTitleLayout {
  const v = (map.get("HOME_HERO_TITLE_LAYOUT") ?? "inline").trim().toLowerCase();
  return v === "stacked" ? "stacked" : "inline";
}

function yesNo(map: Map<string, string>, key: string, defaultYes = true) {
  const v = (map.get(key) ?? (defaultYes ? "yes" : "no")).trim().toLowerCase();
  return v !== "no";
}

function parseVoicesPhotoCount(map: Map<string, string>) {
  const raw = (map.get("HOME_VOICES_PHOTO_COUNT") || "auto").trim().toLowerCase();
  if (raw === "auto") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(10, Math.max(3, Math.round(n)));
}

export function parseHomeHeroBgPaths(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (Array.isArray(j)) {
      return j.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
    }
  } catch {
    /* ignore */
  }
  return [];
}

/** Vult titeldelen; leest oude HOME_HERO_TITLE (em-dash) als deel 1 nog leeg is. */
function resolveHeroTitles(map: Map<string, string>) {
  let t1 = (map.get("HOME_HERO_TITLE_1") ?? "").trim();
  let t2 = (map.get("HOME_HERO_TITLE_2") ?? "").trim();
  const explicit2 = map.has("HOME_HERO_TITLE_2");

  if (!t1) {
    const legacy = (map.get("HOME_HERO_TITLE") ?? "").trim();
    if (legacy) {
      const sep = " — ";
      const i = legacy.indexOf(sep);
      if (i !== -1) {
        t1 = legacy.slice(0, i).trim();
        if (!t2) t2 = legacy.slice(i + sep.length).trim();
      } else {
        t1 = legacy;
      }
    }
  }
  if (!t1) t1 = fallbackMap["HOME_HERO_TITLE_1"] || "Alle hits van nu,";
  if (!t2 && !explicit2) t2 = fallbackMap["HOME_HERO_TITLE_2"] || "altijd dichtbij";
  return { t1, t2 };
}

export async function loadHomeWavePageData(): Promise<{ copy: HomeWaveCopy; heroBgPaths: string[] }> {
  const pairedKeys = (homepageItems as WebsiteTextItem[]).flatMap((i) =>
    i.pairedYesNoVisibilityKey ? [i.pairedYesNoVisibilityKey] : []
  );
  const keys = Array.from(
    new Set([...homepageItems.map((i) => i.key), ...HOMEPAGE_UI_KEYS, ...pairedKeys, "HOME_HERO_BG_PATHS", "HOME_HERO_TITLE"])
  );
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const resolved = resolveHeroTitles(map);
  const { t1, t2 } = resolved;

  let heroTitle1 = t1;
  let heroTitle2 = t2;
  let heroTitle1Color: string = titleColor(map, "HOME_HERO_TITLE_1_COLOR", "white");
  let heroTitle2Color: string = titleColor(map, "HOME_HERO_TITLE_2_COLOR", "teal");

  try {
    const slots = await prisma.homeHeroHeadlineSlot.findMany({ where: { isActive: true } });
    const hit = pickHomeHeroHeadlineSlot(slots, formatAmsterdamYMD(), amsterdamMinutesOfDay());
    if (hit) {
      heroTitle1 = hit.titleLine1;
      heroTitle2 = hit.titleLine2?.trim() ? hit.titleLine2.trim() : t2;
      heroTitle1Color = normalizeHeroColorInput(hit.titleLine1Color, heroTitle1Color === "teal" ? "teal" : "white");
      heroTitle2Color = normalizeHeroColorInput(hit.titleLine2Color, heroTitle2Color === "teal" ? "teal" : "white");
    }
  } catch {
    /* tabel ontbreekt tot db push */
  }

  const showHeroKicker = yesNo(map, "HOME_HERO_KICKER_SHOW", true);
  const copy: HomeWaveCopy = {
    showHeroKicker,
    heroKicker: showHeroKicker ? clean(map, "HOME_HERO_KICKER") : "",
    showPolaroids: yesNo(map, "HOME_WAVE_POLAROIDS_SHOW", true),
    heroBackdropMotion: yesNo(map, "HOME_HERO_BACKDROP_MOTION", true),
    heroTitle1,
    heroTitle1Color,
    heroTitle2,
    heroTitle2Color,
    heroTitleLayout: titleLayout(map),
    heroSubtitle: clean(map, "HOME_HERO_SUBTITLE"),
    sidebarTitle: clean(map, "HOME_SIDEBAR_TITLE"),
    nowLabel: clean(map, "HOME_WAVE_NOW_LABEL"),
    nextLabel: clean(map, "HOME_WAVE_NEXT_LABEL"),
    liveLabel: clean(map, "HOME_WAVE_LIVE_LABEL"),
    recentTracksTitle: clean(map, "HOME_RECENT_TRACKS_TITLE"),
    recentTracksCta: clean(map, "HOME_RECENT_TRACKS_CTA"),
    currentShowTitle: clean(map, "HOME_CURRENT_SHOW_TITLE"),
    currentShowCta: clean(map, "HOME_CURRENT_SHOW_CTA"),
    concertsTitle: clean(map, "HOME_CONCERTS_TITLE"),
    showLipsLogo: yesNo(map, "HOME_SHOW_LIPS_LOGO", true),
    showCurrentShowPanel: yesNo(map, "HOME_PANEL_CURRENT_SHOW", true),
    showRecentTracksPanel: yesNo(map, "HOME_PANEL_RECENT_TRACKS", true),
    showConcertsPanel: yesNo(map, "HOME_PANEL_CONCERTS", true),
    showActionsPanel: yesNo(map, "HOME_PANEL_ACTIONS", false),
    showVoicesPanel: yesNo(map, "HOME_PANEL_VOICES", true),
    showInstagramPanel: yesNo(map, "HOME_PANEL_INSTAGRAM", true),
    showTikTokPanel: yesNo(map, "HOME_PANEL_TIKTOK", true),
    voicesPhotoCount: parseVoicesPhotoCount(map),
    instagramPanelTitle: clean(map, "HOME_INSTAGRAM_PANEL_TITLE"),
    tiktokPanelTitle: clean(map, "HOME_TIKTOK_PANEL_TITLE"),
    instagramProfileUrl: (map.get("HOME_INSTAGRAM_PROFILE_URL") || "https://instagram.com/kissfmnl").trim(),
    tiktokProfileUrl: (map.get("HOME_TIKTOK_PROFILE_URL") || "https://www.tiktok.com/@kissfmnl").trim(),
    instagramEmbedHtml: (map.get("HOME_INSTAGRAM_EMBED_HTML") || "").trim(),
    tiktokEmbedHtml: (map.get("HOME_TIKTOK_EMBED_HTML") || "").trim(),
    instagramPostUrl: (map.get("HOME_INSTAGRAM_POST_URL") || "").trim(),
    tiktokPostUrl: (map.get("HOME_TIKTOK_POST_URL") || "").trim(),
    showAppPopup: yesNo(map, "HOME_APP_POPUP_SHOW", true),
    appPopupTitle: clean(map, "HOME_APP_POPUP_TITLE"),
    appPopupBody: clean(map, "HOME_APP_POPUP_BODY"),
    appPopupUrl: clean(map, "HOME_APP_POPUP_URL"),
    appPopupCta: clean(map, "HOME_APP_POPUP_CTA"),
    showCookieBanner: yesNo(map, "COOKIE_BANNER_SHOW", true),
    cookieBannerText: clean(map, "COOKIE_BANNER_TEXT"),
    cookieBannerCta: clean(map, "COOKIE_BANNER_CTA"),
  };

  const heroBgPaths = parseHomeHeroBgPaths(map.get("HOME_HERO_BG_PATHS"));

  return { copy, heroBgPaths };
}
