"use client";

import { useEffect, useMemo, useRef } from "react";
import { KISS_PANEL_BODY_PAD, KISS_PANEL_HEADER_BOX, KISS_PANEL_HEADER_GAP, KISS_PANEL_TITLE } from "@/lib/publicPanelChrome";

declare global {
  interface Window {
    __kissEmbedScriptPromises?: Partial<Record<string, Promise<void>>>;
  }
}

function loadExternalScript(src: string) {
  if (typeof window === "undefined") return Promise.resolve();
  const key = src;
  if (!window.__kissEmbedScriptPromises) window.__kissEmbedScriptPromises = {};
  if (window.__kissEmbedScriptPromises[key]) return window.__kissEmbedScriptPromises[key];
  window.__kissEmbedScriptPromises[key] = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)), { once: true });
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.addEventListener("load", () => {
      el.dataset.loaded = "1";
      resolve();
    });
    el.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)));
    document.body.appendChild(el);
  });
  return window.__kissEmbedScriptPromises[key];
}

export function SocialProfilePanel({
  title,
  href,
  platform,
  embedHtml,
  postUrl,
}: {
  title: string;
  href: string;
  platform: "instagram" | "tiktok";
  embedHtml?: string;
  postUrl?: string;
}) {
  const isInstagram = platform === "instagram";
  const hasEmbed = Boolean(embedHtml?.trim() || postUrl?.trim());
  const embedRef = useRef<HTMLDivElement | null>(null);

  const parsed = useMemo(() => {
    const raw = (embedHtml || "").trim();
    if (!raw) return { html: "", scriptSrcs: [] as string[] };
    const scriptSrcs: string[] = [];
    const html = raw.replace(/<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (_, src: string) => {
      const s = src.startsWith("//") ? `https:${src}` : src;
      scriptSrcs.push(s);
      return "";
    });
    const igMatch = html.match(/data-instgrm-permalink="([^"]+)"/i) || html.match(/href="(https:\/\/www\.instagram\.com\/[^"]+)"/i);
    const igPermalink = igMatch?.[1] ? igMatch[1].replace(/&amp;/g, "&") : null;
    const ttMatch = html.match(/href="(https:\/\/www\.tiktok\.com\/@[^"]+\/video\/\d+)"/i) || html.match(/cite="(https:\/\/www\.tiktok\.com\/@[^"]+)"/i);
    const ttUrl = ttMatch?.[1] ? ttMatch[1].replace(/&amp;/g, "&") : null;
    return { html, scriptSrcs, igPermalink, ttUrl };
  }, [embedHtml]);

  const directUrl = (postUrl || "").trim();
  const instagramUrl = isInstagram ? (directUrl || parsed.igPermalink || "") : "";
  const tiktokUrl = !isInstagram ? (directUrl || parsed.ttUrl || "") : "";
  const tiktokVideoId = useMemo(() => {
    const m = tiktokUrl.match(/\/video\/(\d+)/i);
    return m?.[1] || "";
  }, [tiktokUrl]);
  const effectiveEmbedHtml = useMemo(() => {
    if (!isInstagram) return parsed.html;
    if (parsed.html.trim()) return parsed.html;
    if (!instagramUrl) return "";
    return `<blockquote class="instagram-media" data-instgrm-permalink="${instagramUrl.replace(/"/g, "&quot;")}" data-instgrm-version="14"></blockquote>`;
  }, [isInstagram, parsed.html, instagramUrl]);
  const hasRenderedEmbed = Boolean((!isInstagram && tiktokVideoId) || (hasEmbed || (isInstagram && instagramUrl)));

  useEffect(() => {
    if (!hasEmbed || !embedRef.current) return;
    embedRef.current.innerHTML = effectiveEmbedHtml;
    const sources =
      parsed.scriptSrcs.length > 0
        ? parsed.scriptSrcs
        : platform === "instagram"
          ? ["https://www.instagram.com/embed.js"]
          : ["https://www.tiktok.com/embed.js"];
    let cancelled = false;
    (async () => {
      for (const src of sources) {
        try {
          await loadExternalScript(src);
        } catch {}
      }
      if (cancelled) return;
      try {
        (window as any).instgrm?.Embeds?.process?.();
      } catch {}
      try {
        (window as any).tiktokEmbedLoad?.();
      } catch {}
      window.setTimeout(() => {
        try {
          (window as any).instgrm?.Embeds?.process?.();
        } catch {}
        try {
          (window as any).tiktokEmbedLoad?.();
        } catch {}
      }, 180);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasEmbed, parsed, platform, effectiveEmbedHtml]);

  return (
    <section className="kiss-public-panel w-full min-w-0 rounded-3xl border border-solid border-[#1e375a]/12 bg-[#f2f8fb] shadow-[0_2px_16px_rgba(30,55,90,0.05)] overflow-hidden">
      <div className={`${KISS_PANEL_HEADER_BOX} shrink-0`}>
        <p className={KISS_PANEL_TITLE}>{title}</p>
      </div>
      <div className={`${KISS_PANEL_BODY_PAD} pt-0`}>
        <div className={`${KISS_PANEL_HEADER_GAP}`}>
          {!isInstagram && tiktokVideoId ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2">
              <iframe
                src={`https://www.tiktok.com/player/v1/${tiktokVideoId}?controls=1&description=1`}
                className="h-[560px] w-full rounded-xl border-0 bg-white"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture"
                title="TikTok video"
              />
            </div>
          ) : (hasEmbed || (isInstagram && instagramUrl)) ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2">
              <div ref={embedRef} className="kiss-social-embed text-sm" />
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-700">
              Voeg een recente {isInstagram ? "Instagram-post URL" : "TikTok-video URL"} toe in de admin voor een stabiele embed.
            </p>
          )}
          {!hasRenderedEmbed ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-9 items-center rounded-full border border-[#1e375a]/20 bg-[#1e375a] px-4 text-xs font-black text-white transition hover:bg-[#162b48]"
            >
              Open {isInstagram ? "Instagram" : "TikTok"}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
