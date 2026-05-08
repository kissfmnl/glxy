export type StudioPurpose = "VT" | "LIVE" | "DEMO" | "CUSTOM";

export const STUDIO_PURPOSE_OPTIONS: Array<{ value: StudioPurpose; label: string }> = [
  { value: "VT", label: "Voicetracken (VT)" },
  { value: "LIVE", label: "Live uitzending" },
  { value: "DEMO", label: "Demo opnemen" },
  { value: "CUSTOM", label: "Overig / custom" },
];

export function googleCalendarUrl({
  title,
  startAt,
  endAt,
  details,
}: {
  title: string;
  startAt: Date;
  endAt: Date;
  details?: string;
}) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const u = new URL("https://calendar.google.com/calendar/render");
  u.searchParams.set("action", "TEMPLATE");
  u.searchParams.set("text", title);
  u.searchParams.set("dates", `${fmt(startAt)}/${fmt(endAt)}`);
  if (details?.trim()) u.searchParams.set("details", details.trim());
  return u.toString();
}
