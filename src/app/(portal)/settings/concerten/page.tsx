import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { deleteConcert, runConcertSyncNow, setConcertVisibility, upsertConcert } from "@/app/actions/concertActions";
import { listWebsiteImageFiles } from "@/lib/websiteImageFiles";
import { ConcertSyncSubmitButton } from "@/components/portal/ConcertSyncSubmitButton";
import { hasPortalPermission } from "@/lib/portalPermissions";

function toInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default async function SettingsConcertenPage({
  searchParams,
}: {
  searchParams?: { saved?: string; synced?: string; syncError?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  await prisma.concert.updateMany({
    where: {
      isActive: true,
      date: { lt: new Date() },
    },
    data: { isActive: false },
  });

  const concerts = await prisma.concert.findMany({
    orderBy: { date: "asc" },
    take: 200,
  });
  const updateConcert = async (formData: FormData) => {
    "use server";
    await upsertConcert(formData);
  };
  const imageOptions = await listWebsiteImageFiles();

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <Link
        href="/settings/site"
        className="inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Concerten</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Concerten op de homepage en concertenpagina.</p>
      </div>
      {searchParams?.saved === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">Opgeslagen.</div>
      ) : null}
      {searchParams?.synced ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-800">
          Concert-sync voltooid. {searchParams.synced} events bijgewerkt/toegevoegd.
        </div>
      ) : null}
      {searchParams?.syncError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          Concert-sync mislukt: {decodeURIComponent(searchParams.syncError)}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card md:p-8">
            <h2 className="mb-2 text-lg font-black text-gray-900 dark:text-white">Automatische concert-sync</h2>
            <p className="mb-4 text-xs font-bold text-gray-500 dark:text-gray-300">
              Sync uit Ticketmaster (grote NL-zalen/arena&apos;s). Vereist <code>TICKETMASTER_API_KEY</code> in je omgeving.
            </p>
            <form action={runConcertSyncNow}>
              <ConcertSyncSubmitButton />
            </form>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card md:p-8">
            <h2 className="mb-6 text-lg font-black text-gray-900 dark:text-white">Nieuw concert</h2>

            <form
              action={async (formData) => {
                "use server";
                await upsertConcert(formData);
                redirect("/settings/concerten?saved=1");
              }}
              className="space-y-4"
            >
              <div className="sticky top-2 z-20 rounded-2xl border border-gray-200 bg-white/95 p-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#1a1f2e]/95">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-primary py-3 text-sm font-black text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
                >
                  Concert opslaan
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Titel</label>
                  <input
                    name="title"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5"
                    placeholder="bijv. Dua Lipa — Live"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Venue</label>
                    <input
                      name="venue"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5"
                      placeholder="bijv. Ziggo Dome"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Stad</label>
                    <input
                      name="city"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5"
                      placeholder="bijv. Amsterdam"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Datum/tijd</label>
                  <input
                    name="date"
                    type="datetime-local"
                    required
                    defaultValue={toInputValue(new Date())}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Link (optioneel)</label>
                  <input
                    name="url"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5"
                    placeholder="https://tickets..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Upload afbeelding (optioneel)</label>
                  <input
                    name="imageFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Of kies bestaande afbeelding</label>
                  <select name="imagePath" defaultValue="" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-brand-primary dark:border-white/10 dark:bg-white/5">
                    <option value="">Niet ingesteld</option>
                    {imageOptions.map((f) => (
                      <option key={`concert-new-${f}`} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Actief</label>
                  <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                    <input name="isActive" type="checkbox" defaultChecked className="accent-brand-primary" />
                    <span className="font-bold text-gray-700 dark:text-gray-200">Ja</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-brand-primary py-4 font-black text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
              >
                Concert opslaan
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Bestaande concerten ({concerts.length})</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {concerts.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-card">
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Nog geen concerten.</p>
              </div>
            ) : (
              concerts.map((c) => (
                <details
                  key={c.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-primary/30 dark:border-white/10 dark:bg-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-white/5">
                        {c.imagePath ? (
                          <img
                            src={"/api/assets/" + c.imagePath.split("/").map(encodeURIComponent).join("/")}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black text-gray-900 dark:text-white">{c.title}</p>
                          {!c.isActive && (
                            <span className="rounded-full border border-gray-500/20 bg-gray-500/10 px-2 py-0.5 text-[10px] font-black text-gray-600">
                              Inactief
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs font-medium text-gray-500">
                          {new Intl.DateTimeFormat("nl-NL", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Europe/Amsterdam",
                          }).format(new Date(c.date))}
                          {c.venue ? ` • ${c.venue}` : ""}
                          {c.city ? ` (${c.city})` : ""}
                        </p>
                        {c.url ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-[11px] font-black text-brand-primary hover:underline"
                          >
                            Tickets/link
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await setConcertVisibility(c.id, !c.isActive);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:border-white/10 dark:hover:text-white"
                          title={c.isActive ? "Verberg" : "Toon"}
                          aria-label={c.isActive ? "Verberg concert" : "Toon concert"}
                        >
                          {c.isActive ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.231.736-.544 1.434-.924 2.083M15.536 15.536A9.97 9.97 0 0112 16c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.006-3.19M9.88 9.88A3 3 0 0114.12 14.12M3 3l18 18"
                              />
                            </svg>
                          )}
                        </button>
                      </form>

                      <form
                        action={async () => {
                          "use server";
                          await deleteConcert(c.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl px-3 py-2 text-xs font-black text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
                        >
                          Verwijder
                        </button>
                      </form>
                    </div>
                  </summary>
                  <form action={async (formData) => {
                    "use server";
                    await upsertConcert(formData);
                    redirect("/settings/concerten?saved=1");
                  }} className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
                    <input type="hidden" name="id" value={c.id} />
                    <div className="md:col-span-2 sticky top-2 z-10 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur-md">
                      <button type="submit" className="w-full rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white">
                        Opslaan
                      </button>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Titel</label>
                      <input name="title" defaultValue={c.title} required className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Venue</label>
                      <input name="venue" defaultValue={c.venue ?? ""} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Stad</label>
                      <input name="city" defaultValue={c.city ?? ""} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Datum/tijd</label>
                      <input
                        name="date"
                        type="datetime-local"
                        defaultValue={toInputValue(new Date(c.date))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Link</label>
                      <input name="url" defaultValue={c.url ?? ""} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold">
                      <input name="isActive" type="checkbox" defaultChecked={c.isActive} className="accent-brand-primary" />
                      Actief
                    </label>
                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Nieuwe afbeelding</label>
                      <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Of kies bestaande afbeelding</label>
                      <select name="imagePath" defaultValue={c.imagePath ?? ""} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold">
                        <option value="">Niet ingesteld</option>
                        {imageOptions.map((f) => (
                          <option key={`concert-edit-${c.id}-${f}`} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <button type="submit" className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white">
                        Opslaan
                      </button>
                      <button
                        type="submit"
                        formAction={async () => {
                          "use server";
                          await deleteConcert(c.id);
                        }}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-500"
                      >
                        Verwijder
                      </button>
                    </div>
                  </form>
                </details>
              ))
            )}
          </div>
        </div>
      </div>
    </PortalPageShell>
  );
}
