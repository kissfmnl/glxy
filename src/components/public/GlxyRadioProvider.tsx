"use client";

import type { GlxyStation } from "@/lib/glxyStations";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "glxy_station_id";

type RadioCtx = {
  stations: GlxyStation[];
  loading: boolean;
  activeStationId: string | null;
  activeStation: GlxyStation | null;
  playing: boolean;
  /** Kiest zender en zet stream + speelt af */
  selectStationAndPlay: (station: GlxyStation) => Promise<void>;
  /** Pauze / speelt huidige stream */
  togglePlay: () => Promise<void>;
  /** Pauze / speelt voor betreffende kaart (toggle als die zender actief is) */
  toggleStation: (station: GlxyStation) => Promise<void>;
  /** Volume 0–1 */
  setVolume: (v: number) => void;
  volume: number;
};

const Ctx = createContext<RadioCtx | null>(null);

export function getGlxySharedAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { __glxyAudio?: HTMLAudioElement };
  if (!w.__glxyAudio) {
    const a = document.createElement("audio");
    a.preload = "none";
    a.crossOrigin = "anonymous";
    w.__glxyAudio = a;
  }
  return w.__glxyAudio;
}

export function GlxyRadioProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<GlxyStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/public/stations");
        const j = (await r.json()) as { stations?: GlxyStation[] };
        const list = Array.isArray(j.stations) ? j.stations : [];
        if (cancelled) return;
        setStations(list);
        let stored: string | null = null;
        try {
          stored = localStorage.getItem(STORAGE_KEY);
        } catch {
          stored = null;
        }
        const prefer =
          stored && list.some((s) => s.id === stored)
            ? stored
            : list.find((s) => s.id === "z1")?.id ?? list[0]?.id ?? null;
        setActiveStationId(prefer);
      } finally {
        if (!cancelled) setLoading(false);
        hydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeStation = useMemo(
    () => stations.find((s) => s.id === activeStationId) ?? stations.find((s) => s.id === "z1") ?? stations[0] ?? null,
    [stations, activeStationId],
  );

  useEffect(() => {
    const a = getGlxySharedAudio();
    if (!a) return;
    setVolumeState(a.volume);

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVol = () => setVolumeState(a.volume);
    a.addEventListener("playing", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("volumechange", onVol);
    setPlaying(!a.paused);
    return () => {
      a.removeEventListener("playing", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("volumechange", onVol);
    };
  }, []);

  useEffect(() => {
    const a = getGlxySharedAudio();
    if (!a || !activeStation?.streamUrl) return;
    const url = activeStation.streamUrl;
    try {
      const cur = new URL(a.src, typeof window !== "undefined" ? window.location.href : "http://localhost");
      const next = new URL(url, typeof window !== "undefined" ? window.location.href : "http://localhost");
      if (cur.href !== next.href) {
        a.pause();
        a.src = url;
      }
    } catch {
      if (a.src !== url) {
        a.pause();
        a.src = url;
      }
    }
  }, [activeStation?.streamUrl, activeStation?.id]);

  /** Mini-player en metadata volgen de stream die daadwerkelijk speelt (src-match). */
  useEffect(() => {
    const a = getGlxySharedAudio();
    if (!a || stations.length === 0) return;

    const syncPlayingStationFromSrc = () => {
      if (a.paused) return;
      const base = typeof window !== "undefined" ? window.location.href : "http://localhost";
      let curHref: string;
      try {
        curHref = new URL(a.currentSrc || a.src || "", base).href;
      } catch {
        curHref = (a.currentSrc || a.src || "").trim();
      }
      if (!curHref) return;

      const match = stations.find((s) => {
        const u = s.streamUrl?.trim();
        if (!u) return false;
        try {
          return new URL(u, base).href === curHref;
        } catch {
          return u === a.src;
        }
      });
      if (match && match.id !== activeStationId) {
        setActiveStationId(match.id);
        try {
          localStorage.setItem(STORAGE_KEY, match.id);
        } catch {
          /* ignore */
        }
      }
    };

    a.addEventListener("playing", syncPlayingStationFromSrc);
    a.addEventListener("loadeddata", syncPlayingStationFromSrc);
    syncPlayingStationFromSrc();
    return () => {
      a.removeEventListener("playing", syncPlayingStationFromSrc);
      a.removeEventListener("loadeddata", syncPlayingStationFromSrc);
    };
  }, [stations, activeStationId]);

  const selectStationAndPlay = useCallback(async (station: GlxyStation) => {
    if (!station.streamUrl?.trim()) return;
    const a = getGlxySharedAudio();
    if (!a) return;
    setActiveStationId(station.id);
    try {
      localStorage.setItem(STORAGE_KEY, station.id);
    } catch {
      /* ignore */
    }
    if (a.src !== station.streamUrl) {
      a.src = station.streamUrl;
    }
    await a.play().catch(() => {});
  }, []);

  const togglePlay = useCallback(async () => {
    const a = getGlxySharedAudio();
    if (!a) return;
    if (a.paused) await a.play().catch(() => {});
    else a.pause();
  }, []);

  const toggleStation = useCallback(
    async (station: GlxyStation) => {
      const a = getGlxySharedAudio();
      if (!a) return;
      const isThis = activeStationId === station.id;
      if (isThis && playing) {
        a.pause();
        return;
      }
      await selectStationAndPlay(station);
    },
    [activeStationId, playing, selectStationAndPlay],
  );

  const setVolume = useCallback((v: number) => {
    const a = getGlxySharedAudio();
    if (!a) return;
    const nv = Math.max(0, Math.min(1, v));
    a.volume = nv;
    setVolumeState(nv);
  }, []);

  const value = useMemo(
    () => ({
      stations,
      loading,
      activeStationId,
      activeStation,
      playing,
      selectStationAndPlay,
      togglePlay,
      toggleStation,
      setVolume,
      volume,
    }),
    [
      stations,
      loading,
      activeStationId,
      activeStation,
      playing,
      selectStationAndPlay,
      togglePlay,
      toggleStation,
      setVolume,
      volume,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGlxyRadio(): RadioCtx {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useGlxyRadio must be used inside GlxyRadioProvider");
  }
  return v;
}
