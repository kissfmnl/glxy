"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { amsterdamHour, formatAmsterdamYMD } from "@/lib/amsterdamClock";
import { PUBLIC_PAGE_INTRO, PUBLIC_PAGE_SHELL } from "@/lib/publicPageLayout";
import { KISS_PANEL_TITLE_ON_DARK } from "@/lib/publicPanelChrome";
import { RichTextWithLinks } from "@/components/public/RichTextWithLinks";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DESKTOP_MENU_CLOSE_MS = 220;

type Track = { id: string; title: string; artist: string; cover: string | null; playedAt: string };

type AnchorRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

type DesktopMenuState = {
  track: Track;
  anchor: AnchorRect;
  placed?: { left: number; top: number; transformOrigin: string };
};

function kissLipsSrc() {
  return "/api/fallback-album-logo";
}

function resolvePlaylistDate(initial: string, dayOptions: { ymd: string }[]): string {
  if (dayOptions.some((o) => o.ymd === initial)) return initial;
  return dayOptions[0]?.ymd ?? initial;
}

function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function spotifySearchUrl(artist?: string, title?: string) {
  const query = [artist, title].filter(Boolean).join(" ");
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

function hourOptionLabel(h: number): string {
  if (h === 23) return "23:00–24:00";
  return `${h}:00–${h + 1}:00`;
}

function rectToAnchor(el: DOMRect): AnchorRect {
  return {
    top: el.top,
    left: el.left,
    right: el.right,
    bottom: el.bottom,
    width: el.width,
    height: el.height,
  };
}

/** Menu opent standaard rechts van de ⋮-knop; alleen bij gebrek aan ruimte links. */
function placeContextMenu(anchor: AnchorRect, menuWidth: number, menuHeight: number) {
  const GAP = 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  let left = anchor.right + GAP;
  let transformOrigin = "top left";
  if (left + menuWidth > vw - GAP) {
    left = anchor.left - menuWidth - GAP;
    transformOrigin = "top right";
  }
  if (left < GAP) {
    left = GAP;
  }
  let top = anchor.top + anchor.height / 2 - menuHeight / 2;
  top = Math.min(Math.max(GAP, top), vh - menuHeight - GAP);
  return { left, top, transformOrigin };
}

function filterShell({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[2.75rem] min-w-0 flex-1 overflow-hidden rounded-xl border border-[#1e375a]/14 bg-[#f2f8fb] shadow-[0_1px_2px_rgba(30,55,90,0.05)] transition-shadow duration-200 hover:shadow-[0_3px_10px_rgba(30,55,90,0.07)] md:min-h-[2.35rem] md:flex-none md:min-w-[8.75rem] md:max-w-[10.75rem] ${className ?? ""}`}
    >
      <span className="flex shrink-0 items-center border-r border-[#1e375a]/10 bg-white/60 px-2 py-2 text-[10px] font-black uppercase tracking-wide text-[#1e375a]/70 md:px-2 md:py-1.5">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}

function TrackCover({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (src && !failed) {
    return <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" draggable={false} onError={() => setFailed(true)} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center p-[18%]" style={{ backgroundColor: "var(--fallback-album-bg, #f2f8fb)" }}>
      <img src={kissLipsSrc()} alt="" className="h-full w-full max-h-[72%] object-contain opacity-90" draggable={false} />
    </div>
  );
}

function MoreVerticalIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );
}

/** Officieel Spotify-icoon in groen, geen extra cirkel. */
function SpotifyLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1DB954"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.399.099-.801-.24-.881-.639-.099-.401.24-.8.63-.88 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      />
    </svg>
  );
}

function TriangleUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 5.5c.65 0 1.26.3 1.67.82l5.58 7.06A2.1 2.1 0 0117.58 17H6.42a2.1 2.1 0 01-1.67-3.62l5.58-7.06c.41-.52 1.02-.82 1.67-.82z" />
    </svg>
  );
}

function TriangleDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 18.5c-.65 0-1.26-.3-1.67-.82L4.75 10.62A2.1 2.1 0 016.42 7h11.16a2.1 2.1 0 011.67 3.62l-5.58 7.06c-.41.52-1.02.82-1.67.82z" />
    </svg>
  );
}

function VotePillRow({
  track,
  userVotes,
  onVote,
  size,
}: {
  track: Track;
  userVotes: Record<string, 1 | -1>;
  onVote: (vote: "up" | "down") => void;
  size: "sm" | "md";
}) {
  const text = size === "md" ? "text-sm" : "text-xs";
  const pad = size === "md" ? "px-5 py-2.5" : "px-4 py-2";
  const icon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const base = `min-w-0 flex-1 rounded-full border font-black ${pad} ${text} inline-flex items-center justify-center gap-2 transition-[transform,background-color,border-color,color] duration-200 ease-out active:scale-[0.97]`;
  return (
    <div className="flex w-full flex-wrap items-stretch gap-2">
      <button
        type="button"
        className={`${base} ${
          userVotes[track.id] === 1
            ? "border-green-600/40 bg-green-100 text-green-900 hover:bg-green-200 hover:border-green-700/45"
            : "border-[#37bfbf]/45 bg-[#d7f4f4] text-[#1f3f62] hover:bg-[#bfecec] hover:border-[#3a9e9e]"
        }`}
        onClick={() => onVote("up")}
      >
        <TriangleUpIcon className={icon} />
        Like
      </button>
      <button
        type="button"
        className={`${base} ${
          userVotes[track.id] === -1
            ? "border-red-600/40 bg-red-100 text-red-900 hover:bg-red-200 hover:border-red-700/45"
            : "border-red-400/45 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-500/50"
        }`}
        onClick={() => onVote("down")}
      >
        <TriangleDownIcon className={icon} />
        Dislike
      </button>
    </div>
  );
}

function TrackMenuPreview({ track, coverSize = "md" }: { track: Track; coverSize?: "sm" | "md" }) {
  const dim = coverSize === "md" ? "h-20 w-20" : "h-[4.5rem] w-[4.5rem]";
  return (
    <div className="flex min-w-0 gap-3 sm:gap-4">
      <div className={`relative ${dim} shrink-0 overflow-hidden rounded-xl border border-[#1e375a]/10 bg-[#f2f8fb] shadow-sm`}>
        <TrackCover src={track.cover} alt="" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-xs font-black uppercase tracking-wider text-gray-500">{formatTime(track.playedAt)}</p>
        <p className="mt-1 truncate text-base font-black text-[#1e375a]">{track.title}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-gray-600">{track.artist}</p>
      </div>
    </div>
  );
}

const HERO_NOW_DARK_DEFAULT =
  "linear-gradient(165deg, #1e375a 0%, #172f4d 45%, #12243c 100%)";

export function PlaylistPageClient({
  texts,
  dateMax,
  dayOptions,
  initialDate,
  initialHour,
}: {
  texts: {
    heroKicker: string;
    pageTitle: string;
    subtitle: string;
    voteHint: string;
    nowPlayedLabel: string;
    historySubtitle: string;
  };
  dateMax: string;
  dayOptions: { ymd: string; label: string }[];
  initialDate: string;
  initialHour: number;
}) {
  void texts.heroKicker;
  void texts.historySubtitle;
  const [date, setDate] = useState(() => resolvePlaylistDate(initialDate, dayOptions));
  const [hourFilter, setHourFilter] = useState<number | "all">(() => {
    const d0 = resolvePlaylistDate(initialDate, dayOptions);
    const maxH = d0 === dateMax ? Math.min(initialHour, amsterdamHour(new Date())) : 23;
    return Math.min(Math.max(0, initialHour), maxH);
  });
  const [voterId, setVoterId] = useState("");
  const [sheetTrack, setSheetTrack] = useState<Track | null>(null);
  const [sheetLeaving, setSheetLeaving] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<DesktopMenuState | null>(null);
  const [desktopMenuLeaving, setDesktopMenuLeaving] = useState(false);
  const desktopMenuPanelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [desktopBackdropOpaque, setDesktopBackdropOpaque] = useState(false);
  const [sheetBackdropOpaque, setSheetBackdropOpaque] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!desktopMenu) {
      setDesktopBackdropOpaque(false);
      return;
    }
    if (desktopMenuLeaving) return;
    setDesktopBackdropOpaque(false);
    const t = window.setTimeout(() => setDesktopBackdropOpaque(true), 20);
    return () => window.clearTimeout(t);
  }, [desktopMenu, desktopMenuLeaving]);

  useEffect(() => {
    if (!sheetTrack) {
      setSheetBackdropOpaque(false);
      return;
    }
    if (sheetLeaving) return;
    setSheetBackdropOpaque(false);
    const t = window.setTimeout(() => setSheetBackdropOpaque(true), 20);
    return () => window.clearTimeout(t);
  }, [sheetTrack, sheetLeaving]);

  useEffect(() => {
    try {
      const key = "kiss_vote_voter_id";
      const existing = window.localStorage.getItem(key);
      if (existing) {
        setVoterId(existing);
        return;
      }
      const generated = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, generated);
      setVoterId(generated);
    } catch {
      setVoterId("anon");
    }
  }, []);

  const listUrl = useMemo(() => {
    const hourQs = hourFilter === "all" ? "" : `&hour=${hourFilter}`;
    return `/api/recent-tracks?date=${encodeURIComponent(date)}${hourQs}&limit=80`;
  }, [date, hourFilter]);

  const { data: nowData } = useSWR("/api/now-playing", fetcher, { refreshInterval: 15_000 });
  const { data: recentData, isValidating } = useSWR(listUrl, fetcher, { refreshInterval: 30_000 });
  const { data: voteData, mutate: mutateVotes } = useSWR(
    voterId ? `/api/playlist-votes?voterId=${encodeURIComponent(voterId)}` : null,
    fetcher,
    { refreshInterval: 10_000 }
  );

  const now = nowData?.current;
  const nowCover = nowData?.cover as string | null | undefined;

  const tracks = (recentData?.tracks as Track[] | undefined) || [];
  const userVotes = (voteData?.userVotes as Record<string, 1 | -1> | undefined) || {};

  const todayYmd = formatAmsterdamYMD(new Date());
  const isSelectedToday = date === todayYmd;
  const maxSelectableHour = isSelectedToday ? amsterdamHour(new Date()) : 23;

  const hoursDescending = useMemo(() => {
    const out: number[] = [];
    for (let h = maxSelectableHour; h >= 0; h--) out.push(h);
    return out;
  }, [maxSelectableHour]);

  useEffect(() => {
    if (hourFilter !== "all" && hourFilter > maxSelectableHour) {
      setHourFilter(maxSelectableHour);
    }
  }, [maxSelectableHour, hourFilter]);

  const closeSheetAnimated = useCallback(() => {
    setSheetLeaving(true);
    window.setTimeout(() => {
      setSheetTrack(null);
      setSheetLeaving(false);
    }, 240);
  }, []);

  const closeSheetImmediate = useCallback(() => {
    setSheetTrack(null);
    setSheetLeaving(false);
  }, []);

  const closeDesktopMenu = useCallback(
    (immediate?: boolean) => {
      if (!desktopMenu) return;
      if (immediate) {
        setDesktopMenu(null);
        setDesktopMenuLeaving(false);
        return;
      }
      setDesktopMenuLeaving(true);
      window.setTimeout(() => {
        setDesktopMenu(null);
        setDesktopMenuLeaving(false);
      }, DESKTOP_MENU_CLOSE_MS);
    },
    [desktopMenu]
  );

  useLayoutEffect(() => {
    if (!desktopMenu || desktopMenu.placed || desktopMenuLeaving || !desktopMenuPanelRef.current) return;
    const el = desktopMenuPanelRef.current;
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;
    const placed = placeContextMenu(desktopMenu.anchor, mw, mh);
    setDesktopMenu((m) => (m ? { ...m, placed } : null));
  }, [desktopMenu, desktopMenuLeaving]);

  useEffect(() => {
    if (!desktopMenu || desktopMenuLeaving) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (desktopMenuPanelRef.current?.contains(t)) return;
      if ((e.target as HTMLElement).closest("[data-playlist-menu-trigger]")) return;
      closeDesktopMenu();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [desktopMenu, desktopMenuLeaving, closeDesktopMenu]);

  useEffect(() => {
    if (!sheetTrack) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSheetAnimated();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetTrack, closeSheetAnimated]);

  useEffect(() => {
    if (!desktopMenu || desktopMenuLeaving) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDesktopMenu();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopMenu, desktopMenuLeaving, closeDesktopMenu]);

  async function sendVote(track: Track, voteType: "up" | "down") {
    await fetch("/api/playlist-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        voteType,
        voterId,
      }),
    });
    void mutateVotes();
  }

  function onMenuTrigger(track: Track, button: HTMLButtonElement) {
    const isMd = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    if (isMd) {
      if (desktopMenu?.track.id === track.id) {
        closeDesktopMenu(true);
        return;
      }
      setDesktopMenuLeaving(false);
      const anchor = rectToAnchor(button.getBoundingClientRect());
      setDesktopMenu({ track, anchor });
      return;
    }
    setSheetLeaving(false);
    setSheetTrack(track);
  }

  const desktopTrack = desktopMenu?.track;

  return (
    <div className={`min-w-0 ${PUBLIC_PAGE_SHELL} min-h-[calc(100dvh-9rem)]`}>
      <div className={PUBLIC_PAGE_INTRO}>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--brand-navy)" }}>
          {texts.pageTitle}
        </h1>
        <RichTextWithLinks text={texts.subtitle} className="mt-3 max-w-2xl text-gray-600" />
      </div>

      <div className="mt-8 min-w-0">
        <div
          className="relative mb-8 overflow-hidden rounded-2xl border border-solid border-white/12 shadow-[0_8px_32px_rgba(8,20,40,0.35)] supports-[backdrop-filter]:backdrop-blur-sm md:rounded-3xl"
          style={{
            background: HERO_NOW_DARK_DEFAULT,
            backgroundClip: "border-box",
          }}
        >
          <div className="absolute right-4 top-3 z-20 md:right-5 md:top-4">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/95 backdrop-blur-sm"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              Live
            </span>
          </div>

          <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="aspect-square h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/25 sm:h-[5.25rem] sm:w-[5.25rem] md:h-[5.5rem] md:w-[5.5rem]">
                <TrackCover src={nowCover ?? null} alt="" />
              </div>
              <div className="flex min-h-[4.5rem] min-w-0 flex-1 flex-col sm:min-h-[5.25rem] md:min-h-[5.5rem] md:pr-2">
                <p className={`${KISS_PANEL_TITLE_ON_DARK} leading-none`}>{texts.nowPlayedLabel}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-white sm:text-xl md:text-[1.65rem] md:leading-tight">
                  {now?.title ?? "Laden…"}
                </h3>
                <p
                  className="mt-auto truncate pt-1 text-sm font-bold leading-snug md:text-base"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  {now?.artist ?? "KISS FM"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex min-w-0 flex-row gap-2 md:mb-4 md:justify-end md:gap-2">
          {filterShell({
            label: "Dag",
            className: "md:min-w-[12.5rem] md:max-w-[18rem]",
            children: (
              <div className="relative w-full px-1.5 outline-none focus-within:ring-2 focus-within:ring-[#37bfbf]/40 md:px-2 md:pr-1">
                <select
                  value={date}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (dayOptions.some((o) => o.ymd === v)) setDate(v);
                  }}
                  className="w-full min-w-0 cursor-pointer appearance-none border-0 bg-transparent py-1.5 pl-1.5 pr-7 text-[13px] font-bold text-[#1e375a] outline-none focus:ring-0 md:py-1 md:pl-2 md:pr-8 md:text-sm"
                  aria-label="Kies dag (vandaag tot 7 dagen terug)"
                >
                  {dayOptions.map((o) => (
                    <option key={o.ymd} value={o.ymd}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#1e375a]/35 md:right-2.5">
                  <svg className="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            ),
          })}
          {filterShell({
            label: "Uur",
            children: (
              <div className="relative w-full px-1.5 md:px-1">
                <select
                  value={hourFilter === "all" ? "all" : String(hourFilter)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setHourFilter(v === "all" ? "all" : Number(v));
                  }}
                  className="w-full cursor-pointer appearance-none border-0 bg-transparent py-1.5 pl-1 pr-7 text-[13px] font-bold text-[#1e375a] outline-none focus:ring-0 md:py-1 md:pl-1.5 md:pr-8 md:text-sm"
                  aria-label="Uur (meest recent bovenaan; onderaan: hele dag)"
                >
                  {hoursDescending.map((h) => (
                    <option key={h} value={h}>
                      {hourOptionLabel(h)}
                    </option>
                  ))}
                  <option value="all">Hele dag</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#1e375a]/35 md:right-2.5">
                  <svg className="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            ),
          })}
        </div>

        {texts.voteHint ? <RichTextWithLinks text={texts.voteHint} className="mb-6 text-sm font-bold text-[#1f3f62]" /> : null}

        {isValidating ? (
          <div className="mb-2 text-right text-xs font-bold text-gray-400">Bijwerken…</div>
        ) : null}

        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1e375a]/20 bg-white/90 py-16 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-600">Geen tracks voor dit tijdvak.</p>
            <p className="mt-2 text-xs text-gray-500">
              Kies een andere dag in het menu (max. 7 dagen terug), een ander uur of &quot;Hele dag&quot; onderaan het uurmenu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {tracks.map((t) => (
              <div key={t.id} className="min-w-0">
                <article className="group rounded-2xl border border-[#1e375a]/10 bg-white shadow-[0_2px_12px_rgba(30,55,90,0.06)] transition-[box-shadow,transform] duration-200 md:hover:-translate-y-1 md:hover:shadow-[0_14px_32px_rgba(30,55,90,0.12)]">
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-[#f2f8fb]">
                    <TrackCover src={t.cover} alt="" />
                    <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-black tabular-nums text-[#1e375a] shadow-sm">
                      {formatTime(t.playedAt)}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 p-2.5 sm:p-3">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-[13px] font-black leading-tight text-[#1e375a] sm:text-sm">{t.title}</p>
                      <p className="mt-0.5 truncate text-xs font-bold text-gray-600">{t.artist}</p>
                    </div>
                    <button
                      type="button"
                      data-playlist-menu-trigger
                      className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-[#1e375a]/55 outline-none transition-colors duration-150 hover:text-[#37bfbf] active:scale-95"
                      aria-label="Acties voor dit nummer"
                      aria-haspopup="true"
                      aria-expanded={desktopMenu?.track.id === t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuTrigger(t, e.currentTarget);
                      }}
                    >
                      <MoreVerticalIcon />
                    </button>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>

      {mounted && desktopTrack && desktopMenu
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[90] cursor-default bg-black/20"
                style={{
                  opacity: desktopMenuLeaving ? 0 : desktopBackdropOpaque ? 1 : 0,
                  transition: "opacity 0.2s ease-out",
                  transitionTimingFunction: desktopMenuLeaving ? "ease-in" : "ease-out",
                }}
                aria-label="Sluit menu"
                onClick={() => closeDesktopMenu()}
              />
              <div
                ref={desktopMenuPanelRef}
                className={`fixed z-[100] w-[min(19.5rem,calc(100vw-1.25rem))] overflow-hidden rounded-xl border border-[#1e375a]/12 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] ${
                  desktopMenuLeaving ? "kiss-playlist-context-menu--leaving" : "kiss-playlist-context-menu"
                }`}
                style={{
                  visibility: desktopMenu.placed ? "visible" : "hidden",
                  left: desktopMenu.placed?.left ?? -9999,
                  top: desktopMenu.placed?.top ?? 0,
                  transformOrigin: desktopMenu.placed?.transformOrigin ?? "top left",
                }}
                role="menu"
                aria-label="Trackacties"
              >
                <div className="p-3">
                  <TrackMenuPreview track={desktopTrack} coverSize="sm" />
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <a
                      href={spotifySearchUrl(desktopTrack.artist, desktopTrack.title)}
                      target="_blank"
                      rel="noreferrer"
                      className="kiss-playlist-spotify-link group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-black text-gray-800 outline-none hover:border-[#1DB954]/28 hover:text-[#0a4d24]"
                      onClick={() => closeDesktopMenu(true)}
                    >
                      <SpotifyLogo className="h-9 w-9 shrink-0" />
                      <span className="min-w-0 text-left leading-tight">
                        <span className="block">Open in Spotify</span>
                        <span className="kiss-playlist-spotify-link__sub mt-0.5 block text-[11px] font-bold text-gray-500 group-hover:text-[#0a4d24]/75">
                          Zoek dit nummer in de app
                        </span>
                      </span>
                    </a>
                  </div>
                  <div className="mt-3">
                    <VotePillRow
                      track={desktopTrack}
                      userVotes={userVotes}
                      size="sm"
                      onVote={(v) => {
                        void sendVote(desktopTrack, v);
                      }}
                    />
                  </div>
                </div>
              </div>
            </>,
            document.body
          )
        : null}

      {sheetTrack ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            style={{
              opacity: sheetLeaving ? 0 : sheetBackdropOpaque ? 1 : 0,
              transition: "opacity 0.2s ease-out",
              transitionTimingFunction: sheetLeaving ? "ease-in" : "ease-out",
            }}
            aria-label="Sluiten"
            onClick={closeSheetAnimated}
          />
          <div
            className={`absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border-t border-[#1e375a]/10 bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ${
              sheetLeaving ? "kiss-playlist-sheet-panel--leaving" : "kiss-playlist-sheet-panel"
            }`}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" aria-hidden />
            <TrackMenuPreview track={sheetTrack} coverSize="md" />
            <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-5">
              <a
                href={spotifySearchUrl(sheetTrack.artist, sheetTrack.title)}
                target="_blank"
                rel="noreferrer"
                className="kiss-playlist-spotify-link group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left outline-none active:scale-[0.97] hover:border-[#1DB954]/28 hover:text-[#0a4d24]"
                aria-label="Zoek op Spotify"
                onClick={closeSheetImmediate}
              >
                <SpotifyLogo className="h-9 w-9 shrink-0" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-black text-[#1f3f62]">Open in Spotify</span>
                  <span className="kiss-playlist-spotify-link__sub mt-0.5 block text-[11px] font-bold text-gray-500 group-hover:text-[#0a4d24]/75">
                    Zoek dit nummer in de app
                  </span>
                </span>
              </a>
              <VotePillRow track={sheetTrack} userVotes={userVotes} size="md" onVote={(v) => void sendVote(sheetTrack, v)} />
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-xl border border-gray-200 py-3 text-sm font-black text-gray-700 transition-transform active:scale-[0.98]"
              onClick={closeSheetAnimated}
            >
              Sluiten
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
