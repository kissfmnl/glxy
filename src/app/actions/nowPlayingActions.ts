"use server";

import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
});

export type GetNowPlayingResult =
  | {
      success: true;
      current: { title: string; artist: string; startTime?: string; duration?: number };
      next: { title: string; artist: string };
      updated?: string;
    }
  | { success: false; error: string };

export async function getNowPlaying(options?: { cache?: "default" | "no-store" }): Promise<GetNowPlayingResult> {
  try {
    const cacheMode = options?.cache ?? "default";
    const response = await fetch("http://217.76.16.199:8095/nowplaying/kiss_nowplaying.xml", {
      ...(cacheMode === "no-store"
        ? { cache: "no-store" as const }
        : { next: { revalidate: 10 } }),
    });

    if (!response.ok) throw new Error("Kon feed niet ophalen");

    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);

    const broadcast = jsonObj.BroadcastMonitor;
    
    return {
      success: true,
      current: {
        title: broadcast?.Current?.titleName || "Onbekend",
        artist: broadcast?.Current?.artistName || "Onbekend",
        startTime: broadcast?.Current?.startTime,
        duration: parseInt(broadcast?.Current?.itemDuration || "0"),
      },
      next: {
        title: broadcast?.Next?.titleName || "Geen volgende track",
        artist: broadcast?.Next?.artistName || "",
      },
      updated: broadcast?.updated
    };
  } catch (error) {
    console.error("Fout bij ophalen Now Playing:", error);
    return { success: false, error: "Feed niet beschikbaar" };
  }
}
