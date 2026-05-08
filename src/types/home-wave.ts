/** Static GLXY homepage (wave variant) — copy shaped like the former CMS-driven payload. */

export type HomePageLayoutVariant = "classic" | "wave";

export type HeroTitleColor = "white" | "teal";

export type HeroTitleLayout = "inline" | "stacked";

export type HomeWaveCopy = {
  showHeroKicker: boolean;
  heroKicker: string;
  showPolaroids: boolean;
  heroBackdropMotion: boolean;
  heroTitle1: string;
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
