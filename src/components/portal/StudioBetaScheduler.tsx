"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { STUDIO_PURPOSE_OPTIONS, type StudioPurpose } from "@/lib/studioBookingUtils";

type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  title: string;
  purpose: string;
  notes: string | null;
  customType: string | null;
  bookedByName: string;
  bookedByUserId: string | null;
  recurrenceGroupId: string | null;
  googleUrl: string;
};

function purposeText(purpose: string, customType: string | null) {
  if (purpose === "VT") return "Voicetracken (VT)";
  if (purpose === "LIVE") return "Live uitzending";
  if (purpose === "DEMO") return "Demo opnemen";
  if (purpose === "CUSTOM") return customType?.trim() ? customType.trim() : "Custom";
  return purpose;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function iso(d: Date) {
  return d.toISOString();
}

function toLocalDateTimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDateTimeInput(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function StudioBetaScheduler({ userName, userId }: { userName: string; userId: string | null }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [title, setTitle] = useState(`${userName} reservering`);
  const [purpose, setPurpose] = useState<StudioPurpose>("VT");
  const [notes, setNotes] = useState("");
  const [customType, setCustomType] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatCount, setRepeatCount] = useState(4);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [readonlyView, setReadonlyView] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const calendarMenuRef = useRef<HTMLDivElement | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const slots = useMemo(() => {
    const out: { hour: number; min: number; label: string }[] = [];
    for (let h = 7; h <= 23; h++) {
      out.push({ hour: h, min: 0, label: `${String(h).padStart(2, "0")}:00` });
      out.push({ hour: h, min: 30, label: "" });
    }
    return out;
  }, []);

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 7);
    try {
      const res = await fetch(`/api/studio-bookings?from=${encodeURIComponent(iso(from))}&to=${encodeURIComponent(iso(to))}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Laden mislukt");
      setBookings(json.bookings || []);
    } catch (e: any) {
      setError(String(e?.message || "Laden mislukt"));
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  useEffect(() => {
    if (!calendarMenuOpen) return;
    function onDocPointerDown(e: MouseEvent | globalThis.MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (calendarMenuRef.current?.contains(target)) return;
      setCalendarMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [calendarMenuOpen]);

  function slotDate(day: Date, hour: number, min: number) {
    const d = new Date(day);
    d.setHours(hour, min, 0, 0);
    return d;
  }

  function slotBookingMeta(d: Date) {
    const booking = bookings.find((b) => {
      const s = new Date(b.startAt);
      const e = new Date(b.endAt);
      return s <= d && d < e;
    });
    if (!booking) return null;
    const s = new Date(booking.startAt);
    const e = new Date(booking.endAt);
    const slotEnd = new Date(d.getTime() + 30 * 60000);
    const isStart = d.getTime() === s.getTime();
    const isEnd = slotEnd.getTime() >= e.getTime();
    return { booking, isStart, isEnd };
  }

  function openCreateModal(start: Date) {
    const end = new Date(start.getTime() + 60 * 60000);
    setEditingId(null);
    setReadonlyView(false);
    setStartInput(toLocalDateTimeInput(start));
    setEndInput(toLocalDateTimeInput(end));
    setTitle(`${userName} reservering`);
    setPurpose("VT");
    setCustomType("");
    setNotes("");
    setSaveMsg(null);
    setModalOpen(true);
  }

  function openExistingModal(b: Booking) {
    const mine = Boolean(userId) && b.bookedByUserId === userId;
    setEditingId(b.id);
    setReadonlyView(!mine);
    setStartInput(toLocalDateTimeInput(new Date(b.startAt)));
    setEndInput(toLocalDateTimeInput(new Date(b.endAt)));
    setTitle(b.title);
    setPurpose((b.purpose as StudioPurpose) || "CUSTOM");
    setCustomType(b.customType || "");
    setNotes(b.notes || "");
    setRepeatWeekly(false);
    setSaveMsg(null);
    setModalOpen(true);
  }

  async function saveBooking() {
    const start = fromLocalDateTimeInput(startInput);
    const end = fromLocalDateTimeInput(endInput);
    if (!start || !end || end <= start) {
      setSaveMsg("Eindtijd moet na starttijd liggen.");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/studio-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          title,
          purpose,
          customType,
          notes,
          repeatWeekly,
          repeatCount,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Opslaan mislukt");
      setModalOpen(false);
      await loadWeek();
    } catch (e: any) {
      setSaveMsg(String(e?.message || "Opslaan mislukt"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBooking() {
    if (!editingId) return;
    setDeleteBusy(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/studio-bookings?id=${encodeURIComponent(editingId)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Verwijderen mislukt");
      setModalOpen(false);
      await loadWeek();
    } catch (e: any) {
      setSaveMsg(String(e?.message || "Verwijderen mislukt"));
    } finally {
      setDeleteBusy(false);
    }
  }

  const isCurrentWeek = startOfWeek(new Date()).getTime() === weekStart.getTime();
  const purposeStyle: Record<string, string> = {
    VT: "border-blue-400 bg-blue-200 text-blue-950",
    LIVE: "border-red-400 bg-red-200 text-red-950",
    DEMO: "border-violet-400 bg-violet-200 text-violet-950",
    CUSTOM: "border-emerald-400 bg-emerald-200 text-emerald-950",
  };
  const icsUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/studio-bookings.ics`
      : "/api/studio-bookings.ics";
  const webcalUrl =
    typeof window !== "undefined" ? icsUrl.replace(/^https?:\/\//, "webcal://") : icsUrl;
  const googleSubscribeUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(icsUrl)}`;
  const outlookSubscribeUrl = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(icsUrl)}&name=${encodeURIComponent("KISS FM Studio")}`;

  function onBookingLeave(e: MouseEvent<HTMLButtonElement>, id: string) {
    const next = (e.relatedTarget as HTMLElement | null)?.closest("[data-booking-id]") as HTMLElement | null;
    if (next?.dataset.bookingId === id) return;
    setHoveredBookingId((prev) => (prev === id ? null : prev));
  }

  async function copyIcsUrl() {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setSaveMsg("Agenda-link gekopieerd.");
    } catch {
      setSaveMsg("Kopieren mislukt. Gebruik handmatig de .ics-link.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            className="rounded-xl px-3 py-2 text-sm font-black text-[#1e375a] transition-all duration-200 ease-out hover:bg-gray-100 sm:px-4"
            onClick={() => setWeekStart((d) => startOfWeek(new Date(d.getTime() - 7 * 24 * 3600 * 1000)))}
            aria-label="Vorige week"
          >
            <span className="sm:hidden">←</span>
            <span className="hidden sm:inline">← Vorige week</span>
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-sm font-black transition-all duration-200 ease-out sm:px-4 ${isCurrentWeek ? "bg-brand-primary text-white" : "text-[#1e375a] hover:bg-gray-100"}`}
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Deze week
          </button>
          <button
            className="rounded-xl px-3 py-2 text-sm font-black text-[#1e375a] transition-all duration-200 ease-out hover:bg-gray-100 sm:px-4"
            onClick={() => setWeekStart((d) => startOfWeek(new Date(d.getTime() + 7 * 24 * 3600 * 1000)))}
            aria-label="Volgende week"
          >
            <span className="sm:hidden">→</span>
            <span className="hidden sm:inline">Volgende week →</span>
          </button>
        </div>
        <div ref={calendarMenuRef} className="w-full max-w-sm space-y-2 sm:w-auto sm:min-w-[280px]">
          <div className="flex items-center gap-2">
            <button onClick={loadWeek} className="rounded-xl bg-[#1e375a] px-4 py-2 text-xs font-black text-white transition-all duration-200 ease-out hover:brightness-110">
              {loading ? "Laden..." : "Ververs"}
            </button>
            <button
              onClick={() => setCalendarMenuOpen((v) => !v)}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-900 transition-all duration-200 ease-out hover:bg-blue-100"
            >
              Voeg kalender toe
            </button>
          </div>
          {calendarMenuOpen ? (
            <div className="absolute right-0 top-14 z-20 w-[min(92vw,340px)] rounded-xl border border-blue-200 bg-white p-2 shadow-xl">
              <div className="grid grid-cols-1 gap-2">
                <a href={googleSubscribeUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-900 transition-all duration-200 ease-out hover:bg-blue-100">
                  Google Calendar
                </a>
                <a href={webcalUrl} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-900 transition-all duration-200 ease-out hover:bg-blue-50">
                  Apple Calendar
                </a>
                <a href={outlookSubscribeUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-900 transition-all duration-200 ease-out hover:bg-blue-50">
                  Outlook
                </a>
                <button onClick={copyIcsUrl} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-left text-xs font-black text-blue-900 transition-all duration-200 ease-out hover:bg-blue-50">
                  Kopieer iCal-link
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">{error}</p> : null}

      <div className="overflow-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full table-fixed text-[10px] sm:text-xs">
          <colgroup>
            <col className="w-12 sm:w-16" />
            {days.map((d) => (
              <col key={`col_${d.toISOString()}`} className="w-[13.6%]" />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th className="w-12 px-1 py-2 text-left font-black sm:w-16 sm:px-2">Tijd</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="px-1 py-2 text-left font-black sm:px-2">
                  {d.toLocaleDateString("nl-NL", { weekday: "short", day: "2-digit", month: "2-digit" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={`${s.hour}-${s.min}`} className={s.min === 0 ? "border-t border-gray-200" : ""}>
                <td className="whitespace-nowrap px-1 py-1 text-[10px] font-black text-gray-500 sm:px-2 sm:text-[11px]">{s.label}</td>
                {days.map((d) => {
                  const sd = slotDate(d, s.hour, s.min);
                  const meta = slotBookingMeta(sd);
                  return (
                    <td key={`${d.toISOString()}_${s.hour}_${s.min}`} className="p-0 align-top">
                      {meta ? (
                        <button
                          onClick={() => openExistingModal(meta.booking)}
                          onMouseEnter={() => setHoveredBookingId(meta.booking.id)}
                          onMouseLeave={(e) => onBookingLeave(e, meta.booking.id)}
                          data-booking-id={meta.booking.id}
                          className={`relative z-10 block h-8 w-full border px-1.5 text-left transition-all duration-200 ease-out sm:px-2 ${hoveredBookingId === meta.booking.id ? "brightness-[0.94] ring-1 ring-black/10" : "hover:brightness-95"} ${
                            purposeStyle[meta.booking.purpose] || purposeStyle.CUSTOM
                          } ${
                            meta.isStart ? "rounded-t-md" : "rounded-none border-t-0 -mt-px"
                          } ${meta.isEnd ? "rounded-b-md" : "border-b-0"} `}
                        >
                          {meta.isStart ? (
                            <>
                              <span className="block truncate text-[11px] font-black">{meta.booking.title}</span>
                              <span className="block truncate text-[10px] font-bold opacity-90">
                                {purposeText(meta.booking.purpose, meta.booking.customType)}
                              </span>
                            </>
                          ) : (
                            <span className="sr-only">{meta.booking.title}</span>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => openCreateModal(sd)}
                          className={`block h-8 w-full bg-white transition-all duration-200 ease-out hover:bg-emerald-50 ${s.min === 0 ? "border border-gray-100" : "border-x border-gray-100 border-t-0"}`}
                          aria-label={`Boek ${sd.toLocaleString("nl-NL", { hour12: false })}`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Nieuwe reservering</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-2 py-1 text-sm font-black text-gray-500 hover:bg-gray-100">
                Sluiten
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-black text-gray-500">
                Van
                <input type="datetime-local" value={startInput} onChange={(e) => setStartInput(e.target.value)} disabled={readonlyView} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100" />
              </label>
              <label className="text-xs font-black text-gray-500">
                Tot
                <input type="datetime-local" value={endInput} onChange={(e) => setEndInput(e.target.value)} disabled={readonlyView} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100" />
              </label>
              <label className="text-xs font-black text-gray-500">
                Naam
                <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={readonlyView} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100" />
              </label>
              <label className="text-xs font-black text-gray-500">
                Type
                <select value={purpose} onChange={(e) => setPurpose(e.target.value as StudioPurpose)} disabled={readonlyView} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100">
                  {STUDIO_PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              {purpose === "CUSTOM" ? (
                <label className="text-xs font-black text-gray-500">
                  Custom type naam
                  <input value={customType} onChange={(e) => setCustomType(e.target.value)} disabled={readonlyView} placeholder="Bijv. Coaching / Podcast opname" className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100" />
                </label>
              ) : null}
              <label className="text-xs font-black text-gray-500 md:col-span-2">
                Omschrijving (optioneel)
                <input value={notes} onChange={(e) => setNotes(e.target.value)} disabled={readonlyView} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100" />
              </label>
            </div>
            {!readonlyView ? <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={repeatWeekly} onChange={(e) => setRepeatWeekly(e.target.checked)} />
                Wekelijks herhalen
              </label>
              {repeatWeekly ? (
                <label className="inline-flex items-center gap-2">
                  Aantal weken
                  <input type="number" min={2} max={24} value={repeatCount} onChange={(e) => setRepeatCount(Number(e.target.value))} className="w-20 rounded-md border px-2 py-1" />
                </label>
              ) : null}
            </div> : null}
            {readonlyView ? <p className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-bold text-gray-700">Alleen lezen: deze reservering is van {bookings.find((b) => b.id === editingId)?.bookedByName || "een andere DJ"}.</p> : null}
            {saveMsg ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-black text-red-700">{saveMsg}</p> : null}
            <div className="mt-4 flex items-center gap-3">
              {!readonlyView ? (
                <>
                  <button disabled={saving} onClick={saveBooking} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-black text-white disabled:opacity-50">
                    {saving ? "Opslaan..." : editingId ? "Wijzigingen opslaan" : "Reservering maken"}
                  </button>
                  {editingId ? (
                    <button disabled={deleteBusy} onClick={deleteBooking} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 disabled:opacity-50">
                      {deleteBusy ? "Verwijderen..." : "Reservering verwijderen"}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
