"use client";

import { useMemo, useState } from "react";
import { saveWebsiteTexts } from "@/app/actions/websiteTextsActions";
import { websiteTextGroups, type WebsiteTextItem } from "@/lib/websiteTextsConfig";
import { HOMEPAGE_UI_KEYS } from "@/lib/homepageUiSettingsConfig";
import { SITE_GENERAL_KEYS } from "@/lib/siteGeneralSettingsConfig";

function fieldDefault(map: Map<string, string>, item: WebsiteTextItem) {
  const raw = map.get(item.key);
  if (raw !== undefined && raw !== null) return raw;
  return item.fallback;
}

function selectDefault(map: Map<string, string>, item: WebsiteTextItem) {
  const raw = (map.get(item.key) ?? item.fallback).trim().toLowerCase();
  const allowed = item.selectOptions!.map((o) => o.value);
  return allowed.includes(raw) ? raw : item.fallback;
}

function visibilityDefaultYes(map: Map<string, string>, visibilityKey: string) {
  const v = (map.get(visibilityKey) ?? "yes").trim().toLowerCase();
  return v !== "no";
}

const BLOCK =
  "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-5";

function KickerLineField({
  item,
  map,
  visibilityKey,
}: {
  item: WebsiteTextItem;
  map: Map<string, string>;
  visibilityKey: string;
}) {
  const [visible, setVisible] = useState(() => visibilityDefaultYes(map, visibilityKey));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={item.key} className="text-sm font-black text-gray-900 dark:text-white">
          {item.label}
        </label>
        <div className="flex items-center gap-2">
          <code className="text-[10px] font-bold text-gray-400 dark:text-white/35">{item.key}</code>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-gray-600 transition-colors dark:text-white/80 ${
              visible
                ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20"
                : "border-gray-200 bg-gray-100 dark:border-white/15 dark:bg-white/10"
            }`}
            title={visible ? "Verbergen op de site" : "Tonen op de site"}
            aria-pressed={visible}
            aria-label={visible ? "Regel verbergen op site" : "Regel tonen op site"}
          >
            {visible ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
      <input type="hidden" name={visibilityKey} value={visible ? "yes" : "no"} />
      <textarea
        id={item.key}
        name={item.key}
        defaultValue={fieldDefault(map, item)}
        rows={item.rows ?? 1}
        className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </div>
  );
}

function FieldRow({ item, map }: { item: WebsiteTextItem; map: Map<string, string> }) {
  if (item.pairedYesNoVisibilityKey) {
    return <KickerLineField item={item} map={map} visibilityKey={item.pairedYesNoVisibilityKey} />;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <label htmlFor={item.key} className="text-sm font-black text-gray-900 dark:text-white">
          {item.label}
        </label>
        <code className="text-[10px] font-bold text-gray-400 dark:text-white/35">{item.key}</code>
      </div>
      {item.helpText ? (
        <p className="text-xs font-medium leading-relaxed text-gray-500 dark:text-white/55">{item.helpText}</p>
      ) : null}
      {item.selectOptions ? (
        <select
          id={item.key}
          name={item.key}
          defaultValue={selectDefault(map, item)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          {item.selectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <textarea
          id={item.key}
          name={item.key}
          defaultValue={fieldDefault(map, item)}
          rows={item.rows ?? (item.key.endsWith("_LABEL") ? 1 : 4)}
          className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      )}
    </div>
  );
}

function GroupPanel({ groupIndex, map }: { groupIndex: number; map: Map<string, string> }) {
  const group = websiteTextGroups[groupIndex];
  const blocks = useMemo(() => {
    const out: { section: string | null; items: WebsiteTextItem[] }[] = [];
    let cur: { section: string | null; items: WebsiteTextItem[] } | null = null;
    for (const item of group.items as WebsiteTextItem[]) {
      const sec = item.section ?? null;
      if (!cur || cur.section !== sec) {
        cur = { section: sec, items: [] };
        out.push(cur);
      }
      cur.items.push(item);
    }
    return out;
  }, [groupIndex]);

  return (
    <div className="space-y-6">
      {blocks.map((block, bi) => (
        <div key={`${block.section ?? "default"}-${bi}`} className={BLOCK}>
          {block.section ? (
            <h4 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-white/55">
              {block.section}
            </h4>
          ) : null}
          <div className="grid gap-4 md:grid-cols-1">
            {block.items.map((item) => (
              <FieldRow key={item.key} item={item} map={map} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WebsiteTekstenEditor({ initialMap }: { initialMap: Map<string, string> }) {
  const hiddenKeys = useMemo(() => new Set([...HOMEPAGE_UI_KEYS, ...SITE_GENERAL_KEYS]), []);
  const visibleGroups = useMemo(
    () =>
      websiteTextGroups
        .map((g) => ({ ...g, items: (g.items as WebsiteTextItem[]).filter((i) => !hiddenKeys.has(i.key)) }))
        .filter((g) => g.items.length > 0),
    [hiddenKeys]
  );
  const [active, setActive] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const group = visibleGroups[active];

  return (
    <form action={saveWebsiteTexts} className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
      <button
        type="button"
        className={`fixed right-3 top-3 z-[60] h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-800 shadow-md dark:border-white/15 dark:bg-[#1a1f2e] dark:text-white lg:hidden ${mobileNavOpen ? "hidden" : "flex"}`}
        onClick={() => setMobileNavOpen(true)}
        aria-expanded={mobileNavOpen}
        aria-controls="website-teksten-nav"
        aria-label="Open paginamenu"
      >
        <span>Pagina</span>
        <svg className="h-5 w-5 shrink-0 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
          aria-label="Menu sluiten"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <nav
        id="website-teksten-nav"
        className={`fixed left-0 top-0 z-[56] flex h-full w-[min(100%,18rem)] max-w-[85vw] shrink-0 flex-col gap-1 overflow-y-auto border-r border-gray-200 bg-white p-3 pt-16 shadow-xl transition-transform duration-200 dark:border-white/10 dark:bg-[#151923] lg:static lg:z-auto lg:h-auto lg:w-56 lg:max-w-none lg:rounded-2xl lg:border lg:p-2 lg:pt-2 lg:shadow-sm ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Paginatabs"
      >
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 dark:border-white/15 dark:text-white lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Sluit paginamenu"
        >
          ✕
        </button>
        <p className="mb-2 hidden px-2 text-[10px] font-black uppercase tracking-widest text-gray-400 lg:block">Pagina</p>
        {visibleGroups.map((g, i) => (
          <button
            key={g.page}
            type="button"
            onClick={() => {
              setActive(i);
              setMobileNavOpen(false);
            }}
            className={`rounded-xl px-3 py-2.5 text-left text-sm font-black transition-colors ${
              i === active
                ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
                : "text-gray-700 hover:bg-gray-100 dark:text-white/85 dark:hover:bg-white/10"
            }`}
          >
            {g.page}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-4 pb-8">
        <div className="sticky top-2 z-40 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[#1a1f2e]/95">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary/90"
          >
            Alles opslaan
          </button>
        </div>

        <div className="border-b border-gray-200 pb-4 pr-[5.5rem] dark:border-white/10 lg:pr-0">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">{group.page}</h2>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-white/50">
            Zelfde opmaak voor elke pagina. Oogje = regel boven de titel tonen of verbergen (waar van toepassing). Collage-foto’s op de
            homepagina:{" "}
            <a href="/settings/homepage-collage" className="font-black text-brand-primary underline-offset-2 hover:underline">
              Collage achtergrond
            </a>
            .
          </p>
        </div>

        {visibleGroups.map((g, gi) => (
          <div key={g.page} className={gi === active ? "block" : "hidden"} aria-hidden={gi !== active}>
            <GroupPanel groupIndex={gi} map={initialMap} />
          </div>
        ))}
      </div>
    </form>
  );
}
