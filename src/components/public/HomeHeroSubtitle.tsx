"use client";

import { Fragment, useSyncExternalStore } from "react";

const MQ = "(max-width: 767px) and (orientation: portrait)";

function subscribePortrait(cb: () => void) {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getPortraitSnapshot() {
  return window.matchMedia(MQ).matches;
}

/** SSR / eerste paint: geen portrait (desktop-set), voorkomt flash van verkeerde mobiele set op crawlers. */
function getServerSnapshot() {
  return false;
}

function useNarrowPortrait() {
  return useSyncExternalStore(subscribePortrait, getPortraitSnapshot, getServerSnapshot);
}

function segmentsFromCaret(raw: string): { parts: string[]; useCaret: boolean } {
  if (!raw.includes("^")) return { parts: [raw], useCaret: false };
  const parts = raw.split("^").map((s) => s.trim());
  const hasContent = parts.some((s) => s.length > 0);
  return { parts: hasContent ? parts : [raw.replace(/\^/g, "").trim()], useCaret: true };
}

type PieceKind = "plain" | "mobileOnly" | "desktopOnly";

function parsePieces(raw: string): Array<{ kind: PieceKind; text: string }> {
  const pieces: Array<{ kind: PieceKind; text: string }> = [];
  let i = 0;
  while (i < raw.length) {
    if (raw.startsWith("''", i)) {
      const j = raw.indexOf("''", i + 2);
      if (j === -1) {
        pieces.push({ kind: "plain", text: raw.slice(i) });
        break;
      }
      pieces.push({ kind: "mobileOnly", text: raw.slice(i + 2, j) });
      i = j + 2;
    } else if (raw.startsWith('""', i)) {
      const j = raw.indexOf('""', i + 2);
      if (j === -1) {
        pieces.push({ kind: "plain", text: raw.slice(i) });
        break;
      }
      pieces.push({ kind: "desktopOnly", text: raw.slice(i + 2, j) });
      i = j + 2;
    } else {
      const a = raw.indexOf("''", i);
      const b = raw.indexOf('""', i);
      const nexts = [a, b].filter((x) => x >= 0);
      const next = nexts.length ? Math.min(...nexts) : -1;
      if (next === -1) {
        if (i < raw.length) pieces.push({ kind: "plain", text: raw.slice(i) });
        break;
      }
      if (next > i) pieces.push({ kind: "plain", text: raw.slice(i, next) });
      i = next;
    }
  }
  return pieces.filter((p) => p.text.length > 0);
}

function CaretBranches({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((seg, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {seg.length > 0 ? seg : null}
        </Fragment>
      ))}
    </>
  );
}

/** caretBreak true = mobiel portrait (^ → <br />); false = desktop/landschap (^ → spatie). */
function renderCaretSegment(text: string, caretBreak: boolean) {
  const { parts, useCaret } = segmentsFromCaret(text);
  if (!useCaret) return text;
  if (caretBreak) return <CaretBranches parts={parts} />;
  return parts.filter((s) => s.length > 0).join(" ");
}

const P_CLASS =
  "mt-2.5 text-base text-white/90 font-bold leading-relaxed whitespace-pre-line";

/**
 * Viewport-gestuurde DOM (geen display:none voor hele blokken): op smal+portrait worden ""-segmenten
 * niet gerenderd; op desktop/landschap worden ''-segmenten niet gerenderd.
 */
export function HomeHeroSubtitle({ text }: { text: string }) {
  const narrowPortrait = useNarrowPortrait();
  const pieces = parsePieces(text);
  // Smal+portrait: plain + '' (buiten ""); desktop-""-blokken worden niet gerenderd. Anders: plain + "".
  const filtered = narrowPortrait
    ? pieces.filter((p) => p.kind === "plain" || p.kind === "mobileOnly")
    : pieces.filter((p) => p.kind === "plain" || p.kind === "desktopOnly");

  if (filtered.length === 0) return null;

  return (
    <p className={P_CLASS}>
      {filtered.map((p, idx) => (
        <Fragment key={idx}>{renderCaretSegment(p.text, narrowPortrait)}</Fragment>
      ))}
    </p>
  );
}
