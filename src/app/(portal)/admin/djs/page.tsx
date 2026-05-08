import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { deleteJock, upsertJock } from "@/app/actions/scheduleActions";
import { AdminJockFactsEditor } from "@/components/portal/AdminJockFactsEditor";
import { listWebsiteImageFiles } from "@/lib/websiteImageFiles";
import { redirect as navRedirect } from "next/navigation";
import { hasPortalPermission } from "@/lib/portalPermissions";
import { ExistingImagePickerModal } from "@/components/portal/ExistingImagePickerModal";

function formatShowName(value: string) {
  const v = value.trim().toLowerCase();
  if (v === "non-stop" || v === "nonstop" || v === "kiss non-stop" || v === "kiss nonstop") return "KISS Non-stop";
  return value;
}

function assetSrc(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  return "/api/assets/" + imagePath.split("/").map(encodeURIComponent).join("/");
}

export default async function AdminDjsPage({ searchParams }: { searchParams?: { saved?: string; err?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageDjs")) redirect("/settings");

  const jocks = await prisma.jock.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  const imageOptions = await listWebsiteImageFiles();

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">DJ beheer</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Beheer DJ-profielen, foto’s en zichtbaarheid.</p>
      </div>
      {searchParams?.saved === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">Opgeslagen.</div>
      ) : null}
      {searchParams?.err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          {decodeURIComponent(searchParams.err)}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        <div className="xl:col-span-2 bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-premium">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Nieuwe DJ</h2>

          <form
            action={async (formData) => {
              "use server";
              const res = await upsertJock(formData);
              if (!res.success) {
                navRedirect(`/admin/djs?err=${encodeURIComponent(res.error)}`);
              }
              navRedirect("/admin/djs?saved=1");
            }}
            encType="multipart/form-data"
            className="space-y-4"
          >
            <div className="sticky top-2 z-20 rounded-2xl border border-gray-200 bg-white/95 p-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#1a1f2e]/95">
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-primary py-3 text-sm font-black text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
              >
                DJ opslaan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Naam</label>
                <input
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  placeholder="bijv. Ferry Oomen"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Slug</label>
                <input
                  name="slug"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  placeholder="ferry-oomen"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Actief</label>
                <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm">
                  <input name="isActive" type="checkbox" defaultChecked className="accent-brand-primary" />
                  <span className="text-gray-700 dark:text-gray-200 font-bold">Ja</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Quote op overzicht (optioneel)
                </label>
                <input
                  name="cardQuote"
                  maxLength={220}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  placeholder="Leeg = standaard “Bekijk meer” op de website"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Upload foto (optioneel)</label>
                <input
                  name="imageFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Of kies bestaande foto</label>
                <ExistingImagePickerModal
                  name="imagePath"
                  files={imageOptions}
                  selected=""
                  buttonLabel="Kies bestaande foto"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Upload profielpagina foto (half-body, optioneel)</label>
                <input
                  name="profileImageFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Of kies bestaande profielfoto</label>
                <ExistingImagePickerModal
                  name="profileImagePath"
                  files={imageOptions}
                  selected=""
                  buttonLabel="Kies bestaande profielfoto"
                />
              </div>
              <input type="hidden" name="imageFocusX" value={50} />
              <input type="hidden" name="imageFocusY" value={50} />
              <input type="hidden" name="profileFocusX" value={50} />
              <input type="hidden" name="profileFocusY" value={50} />
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DJ info / bio</label>
                <textarea
                  name="bioText"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  placeholder="Korte introductie over deze DJ"
                />
              </div>
              <AdminJockFactsEditor initialJson={null} />
            </div>
          </form>
        </div>
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Bestaande DJ’s ({jocks.length})</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {jocks.length === 0 ? (
              <div className="bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-premium">
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Nog geen DJ’s toegevoegd.</p>
              </div>
            ) : (
              jocks.map((j) => (
                <details
                  key={j.id}
                  className="p-5 bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-2xl group hover:border-brand-primary/30 transition-all shadow-sm hover:shadow-md"
                >
                  <summary className="list-none cursor-pointer flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 border border-black/5 shrink-0">
                        {assetSrc(j.imagePath) ? (
                          <img
                            src={assetSrc(j.imagePath)!}
                            alt={j.name}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${j.imageFocusX}% ${j.imageFocusY}%` }}
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-900 dark:text-white truncate">{formatShowName(j.name)}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{j.slug}</p>
                      </div>
                    </div>
                    {!j.isActive ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-gray-500/10 text-gray-600 border-gray-500/20">
                        Inactief
                      </span>
                    ) : null}
                  </summary>
                  <div className="mt-3 border-t border-gray-100 dark:border-white/10 pt-3">
                    <form action={async (formData) => {
                      "use server";
                      const res = await upsertJock(formData);
                      if (!res.success) {
                        navRedirect(`/admin/djs?err=${encodeURIComponent(res.error)}`);
                      }
                      navRedirect("/admin/djs?saved=1");
                    }} encType="multipart/form-data" className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="hidden" name="id" value={j.id} />
                      <div className="md:col-span-2 sticky top-2 z-10 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur-md">
                        <button type="submit" className="w-full rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white">
                          Opslaan
                        </button>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Naam</label>
                        <input name="name" defaultValue={j.name} required className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white dark:bg-card text-sm font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Slug</label>
                        <input name="slug" defaultValue={j.slug} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white dark:bg-card text-sm font-bold" />
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white dark:bg-card text-sm font-bold mt-5">
                        <input name="isActive" type="checkbox" defaultChecked={j.isActive} className="accent-brand-primary" />
                        Actief
                      </label>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                          Quote op overzicht (optioneel)
                        </label>
                        <input
                          name="cardQuote"
                          defaultValue={j.cardQuote ?? ""}
                          maxLength={220}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white dark:bg-card text-sm font-bold"
                          placeholder="Leeg = “Bekijk meer”"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nieuwe foto (optioneel)</label>
                        <input
                          name="imageFile"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white dark:bg-card text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Of kies bestaande foto</label>
                        <ExistingImagePickerModal
                          name="imagePath"
                          files={imageOptions}
                          selected={j.imagePath ?? ""}
                          buttonLabel="Kies bestaande foto"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nieuwe profielpagina foto (optioneel)</label>
                        <input
                          name="profileImageFile"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white dark:bg-card text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Of kies bestaande profielfoto</label>
                        <ExistingImagePickerModal
                          name="profileImagePath"
                          files={imageOptions}
                          selected={j.profileImagePath ?? ""}
                          buttonLabel="Kies bestaande profielfoto"
                        />
                      </div>
                      <input type="hidden" name="imageFocusX" value={j.imageFocusX} />
                      <input type="hidden" name="imageFocusY" value={j.imageFocusY} />
                      <input type="hidden" name="profileFocusX" value={j.profileFocusX} />
                      <input type="hidden" name="profileFocusY" value={j.profileFocusY} />
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">DJ info / bio</label>
                        <textarea
                          name="bioText"
                          defaultValue={j.bioText ?? ""}
                          rows={4}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white dark:bg-card text-sm font-semibold"
                        />
                      </div>
                      <AdminJockFactsEditor initialJson={j.personalFactsJson} />
                      <div className="md:col-span-2 flex items-center gap-2">
                        <button
                          type="submit"
                          formAction={async () => {
                            "use server";
                            await deleteJock(j.id);
                            navRedirect("/admin/djs?saved=1");
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-black text-red-500 bg-red-50 border border-red-200"
                        >
                          Verwijder
                        </button>
                      </div>
                    </form>
                  </div>
                </details>
              ))
            )}
          </div>
        </div>
      </div>
    </PortalPageShell>
  );
}
