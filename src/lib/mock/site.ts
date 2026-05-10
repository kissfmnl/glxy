import type { HomeWaveCopy } from "@/types/home-wave";

/** Remote images (no /api, no DB). */
const NEBULA = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80&auto=format&fit=crop";
const GALAXY = "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600&q=80&auto=format&fit=crop";
const STARS = "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1600&q=80&auto=format&fit=crop";

export const MOCK_SOCIAL = {
  instagramUrl: "https://instagram.com",
  tiktokUrl: "https://www.tiktok.com",
  streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // silent-ish demo stream placeholder
};

export const MOCK_PUBLIC_UI = {
  fallbackAlbumBg: "#0c1020",
  showCookieBanner: true,
  cookieBannerText: "GLXY Radio gebruikt alleen functionele cookies voor deze demo-site.",
  cookieBannerCta: "Ok, verder",
  tabTitle: "GLXY Radio",
};

export const MOCK_NAV = [
  { href: "/", label: "Home" },
  { href: "/glxy-tv", label: "GLXY TV" },
  { href: "/playlist", label: "Playlist" },
  { href: "/adverteren", label: "Adverteren" },
  { href: "/drop-n-demo", label: "Drop 'n Demo" },
  { href: "/passdeaux", label: "Passdeaux" },
  { href: "/airplay-top-20", label: "Airplay Top 20" },
  { href: "/frequenties", label: "Frequenties" },
  { href: "/press", label: "Press" },
] as const;

export const MOCK_HOME_WAVE_COPY: HomeWaveCopy = {
  showHeroKicker: true,
  heroKicker: "Live · altijd in beweging",
  showPolaroids: true,
  heroBackdropMotion: true,
  heroTitle1: "Jouw station,",
  heroTitle1Color: "white",
  heroTitle2: "oneindig veel geluid.",
  heroTitle2Color: "teal",
  heroTitleLayout: "inline",
  heroSubtitle: "Futuristische beats, cosmic hits en de warmte van de melkweg — waar je ook bent.",
  sidebarTitle: "Nu op GLXY Radio",
  nowLabel: "Nu",
  nextLabel: "Straks",
  liveLabel: "Live",
  recentTracksTitle: "JUST PLAYED",
  recentTracksCta: "Open playlist",
  currentShowTitle: "Programmering",
  currentShowCta: "Volledige programmering",
  concertsTitle: "Podia in de ruimte",
  showLipsLogo: false,
  showCurrentShowPanel: true,
  showRecentTracksPanel: true,
  showConcertsPanel: true,
  showActionsPanel: true,
  showVoicesPanel: true,
  showInstagramPanel: true,
  showTikTokPanel: false,
  voicesPhotoCount: 6,
  instagramPanelTitle: "Instagram",
  tiktokPanelTitle: "TikTok",
  instagramProfileUrl: MOCK_SOCIAL.instagramUrl,
  tiktokProfileUrl: MOCK_SOCIAL.tiktokUrl,
  instagramEmbedHtml: "",
  tiktokEmbedHtml: "",
  instagramPostUrl: "",
  tiktokPostUrl: "",
  showAppPopup: false,
  appPopupTitle: "",
  appPopupBody: "",
  appPopupUrl: "",
  appPopupCta: "",
  showCookieBanner: MOCK_PUBLIC_UI.showCookieBanner,
  cookieBannerText: MOCK_PUBLIC_UI.cookieBannerText,
  cookieBannerCta: MOCK_PUBLIC_UI.cookieBannerCta,
};

export const MOCK_HERO_BACKDROP_PATHS: string[] = [NEBULA, GALAXY, STARS];

export type MockJock = {
  name: string;
  imagePath: string;
  slug: string;
  imageFocusX: number;
  imageFocusY: number;
};

/** imagePath doubles as HTTPS poster for mock */
export const MOCK_JOCKS: MockJock[] = [
  { name: "Nova", slug: "nova", imagePath: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop", imageFocusX: 0.5, imageFocusY: 0.4 },
  { name: "Orion", slug: "orion", imagePath: "https://images.unsplash.com/photo-1539578705160-087b367a8437?w=400&h=400&fit=crop", imageFocusX: 0.52, imageFocusY: 0.45 },
  { name: "Lyra", slug: "lyra", imagePath: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop", imageFocusX: 0.5, imageFocusY: 0.35 },
  { name: "Vega", slug: "vega", imagePath: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop", imageFocusX: 0.48, imageFocusY: 0.42 },
  { name: "Sol", slug: "sol", imagePath: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop", imageFocusX: 0.5, imageFocusY: 0.45 },
  { name: "Astra", slug: "astra", imagePath: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop", imageFocusX: 0.5, imageFocusY: 0.4 },
];

export type MockTrack = { title: string; artist: string; cover: string | null };

export const MOCK_PLAYED_TRACKS: MockTrack[] = [
  { title: "Nebula Drift", artist: "Photon", cover: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=200&h=200&fit=crop" },
  { title: "Signal Lost", artist: "Array", cover: "https://images.unsplash.com/photo-1618172193622-ae2d025ff403?w=200&h=200&fit=crop" },
  { title: "Afterglow FM", artist: "Coastlight", cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429daa?w=200&h=200&fit=crop" },
  { title: "Cosmic Laundry", artist: "Tumble", cover: "https://images.unsplash.com/photo-1520454974749-611b7248ffc5?w=200&h=200&fit=crop" },
  { title: "Satellite Sunday", artist: "LOW ORBIT", cover: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=200&h=200&fit=crop" },
  { title: "Glass Echo", artist: "Violet Phase", cover: "https://images.unsplash.com/photo-1542810634-e89fac94443e?w=200&h=200&fit=crop" },
];

export const MOCK_NOW_PLAYING = {
  artist: "GLXY Ensemble",
  title: "Interstellar (demo)",
  cover: "https://images.unsplash.com/photo-1507400492013-162706c8a05e?w=320&h=320&fit=crop",
};

export type MockPlaylistEntry = MockTrack & { id: string };

export const MOCK_PLAYLIST: MockPlaylistEntry[] = MOCK_PLAYED_TRACKS.map((t, i) => ({
  id: `m-${i}`,
  ...t,
}));

/** Throwback-picker lijst (zelfde nummers als playlist-mock). */
export const MOCK_THROWBACK_SONGS = MOCK_PLAYLIST.map((t, i) => ({
  id: t.id,
  artist: t.artist,
  title: t.title,
  year: 2018 + (i % 8),
  coverUrl: t.cover,
}));

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Demo playlist grid: ISO timestamps with fixed +02:00 offset (no DST math). */
export function buildMockPlaylistTracks(
  dateYmd: string,
  hourFilter: number | "all"
): { id: string; title: string; artist: string; cover: string | null; playedAt: string }[] {
  const tz = "+02:00";
  if (hourFilter === "all") {
    const out: { id: string; title: string; artist: string; cover: string | null; playedAt: string }[] = [];
    let k = 0;
    for (let h = 20; h >= 10; h--) {
      for (let i = 0; i < MOCK_PLAYLIST.length; i++) {
        const t = MOCK_PLAYLIST[i % MOCK_PLAYLIST.length]!;
        const m = 55 - (k % 6) * 9;
        out.push({
          id: `pl-${dateYmd}-h${h}-${i}`,
          title: t.title,
          artist: t.artist,
          cover: t.cover,
          playedAt: `${dateYmd}T${pad2(h)}:${pad2(Math.max(0, m))}:00${tz}`,
        });
        k++;
        if (out.length >= 32) return out;
      }
    }
    return out;
  }
  return MOCK_PLAYLIST.map((t, i) => ({
    id: `pl-${dateYmd}-h${hourFilter}-${i}`,
    title: t.title,
    artist: t.artist,
    cover: t.cover,
    playedAt: `${dateYmd}T${pad2(hourFilter)}:${pad2(Math.max(0, 55 - i * 9))}:00${tz}`,
  }));
}

export type MockScheduleSlot = {
  id: string;
  weekday: number;
  startHm: string;
  endHm: string;
  showName: string;
  djName?: string | null;
};

export const MOCK_SCHEDULE: MockScheduleSlot[] = [
  { id: "1", weekday: 1, startHm: "07:00", endHm: "10:00", showName: "Morning Lift", djName: "Nova" },
  { id: "2", weekday: 1, startHm: "10:00", endHm: "14:00", showName: "Midnight City (day edition)", djName: "Orion" },
  { id: "3", weekday: 1, startHm: "14:00", endHm: "18:00", showName: "Neon Drive", djName: "Lyra" },
  { id: "4", weekday: 2, startHm: "07:00", endHm: "12:00", showName: "Cosmic Breakfast", djName: "Vega" },
  { id: "5", weekday: 5, startHm: "18:00", endHm: "22:00", showName: "Friday Pulse", djName: "Sol" },
];

export type MockConcert = { id: string; name: string; city: string; dateLabel: string; url: string | null; imageUrl: string | null };

export const MOCK_CONCERTS: MockConcert[] = [
  { id: "c1", name: "Stellar Fields", city: "Amsterdam", dateLabel: "12 jul", url: "#", imageUrl: GALAXY },
  { id: "c2", name: "Ion Festival", city: "Rotterdam", dateLabel: "3 aug", url: "#", imageUrl: NEBULA },
];

export type MockAction = {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  imagePath: string | null;
};

export const MOCK_ACTIONS: MockAction[] = [
  { slug: "glxy-night", title: "GLXY Night", subtitle: "Tickets & info", href: "#", imagePath: STARS },
  { slug: "meet-hosts", title: "Meet the hosts", subtitle: "Achter de mic", href: "/djs", imagePath: NEBULA },
];

export function heroBackdropSlidesFromMock(max: number) {
  const seen = new Set<string>();
  const out: { src: string }[] = [];
  for (const url of MOCK_HERO_BACKDROP_PATHS) {
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ src: url });
    if (out.length >= max) break;
  }
  for (const t of MOCK_PLAYED_TRACKS) {
    if (!t.cover || seen.has(t.cover)) continue;
    seen.add(t.cover);
    out.push({ src: t.cover });
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

/** Fallback art / lip substitute for panels */
export const MOCK_COVER_FALLBACK = MOCK_NOW_PLAYING.cover!;

/** `GET /api/now-playing` shape used by panels + mini player */
export const MOCK_NOW_PLAYING_PAYLOAD = {
  current: { title: MOCK_NOW_PLAYING.title, artist: MOCK_NOW_PLAYING.artist },
  next: { title: "Ion Drive", artist: "Starline" },
  cover: MOCK_NOW_PLAYING.cover,
};

export const MOCK_CURRENT_SHOW_PAYLOAD = {
  found: true,
  label: "Morning Lift · GLXY Sunrise",
  time: "07:00 – 10:00 · live",
  jock: {
    name: MOCK_JOCKS[0]!.name,
    imagePath: MOCK_JOCKS[0]!.imagePath,
  },
};

export const MOCK_RECENT_TRACKS_PAYLOAD = {
  tracks: MOCK_PLAYED_TRACKS.map((t, i) => ({
    id: `mock-${i}`,
    title: t.title,
    artist: t.artist,
    cover: t.cover,
    playedAt: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
  })),
};

export type MockProgrammingSlot = {
  id: string;
  jockId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
  notes: string | null;
  coHostName: string | null;
  programImagePath?: string | null;
  jock: {
    id: string;
    name: string;
    imagePath: string | null;
    imageFocusX: number;
    imageFocusY: number;
  };
};

export function getMockProgrammingData(): {
  slots: MockProgrammingSlot[];
  temporarySlots: (MockProgrammingSlot & { startsOn: string; endsOn: string; isActive: boolean })[];
} {
  const slots: MockProgrammingSlot[] = MOCK_SCHEDULE.map((s, i) => {
    const dj =
      MOCK_JOCKS.find((j) => j.name === (s.djName || "")) || MOCK_JOCKS[i % MOCK_JOCKS.length]!;
    return {
      id: s.id,
      jockId: `jk-${dj.slug}`,
      dayOfWeek: s.weekday,
      startTime: s.startHm,
      endTime: s.endHm,
      label: s.showName,
      notes: "Demo-slot — geen live data.",
      coHostName: null,
      programImagePath: null,
      jock: {
        id: dj.slug,
        name: dj.name,
        imagePath: dj.imagePath,
        imageFocusX: dj.imageFocusX,
        imageFocusY: dj.imageFocusY,
      },
    };
  });
  return { slots, temporarySlots: [] };
}
