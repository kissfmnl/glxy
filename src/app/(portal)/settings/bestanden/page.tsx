import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { deleteWebsiteFile, getWebsiteFileUsageMap, listWebsiteFiles, renameWebsiteFile, uploadWebsiteFile } from "@/app/actions/fileManagerActions";
import { hasPortalPermission } from "@/lib/portalPermissions";

export const dynamic = "force-dynamic";

export default async function SettingsBestandenPage({
  searchParams,
}: {
  searchParams?: { saved?: string; err?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageFiles")) redirect("/settings");

  const files = await listWebsiteFiles();
  const usageMap = await getWebsiteFileUsageMap();
  const imageExt = new Set(["png", "jpg", "jpeg", "webp", "avif", "gif", "svg", "ico"]);
  const srcFor = (rel: string) => "/api/assets/" + ["Website", ...rel.split("/")].map(encodeURIComponent).join("/");

  return (
    <PortalPageShell width="wide" className="space-y-6">
      <Link href="/settings/site" className="inline-flex items-center gap-2 text-sm font-black text-brand-primary hover:underline">
        ← Terug naar site instellingen
      </Link>
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Bestanden</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload, hernoem en verwijder bestanden in de `Website/` map.</p>
      </div>
      {searchParams?.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">Opgeslagen.</div>
      ) : null}
      {searchParams?.err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          {decodeURIComponent(searchParams.err)}
        </div>
      ) : null}

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-black text-gray-900">Upload bestand</h2>
        <form
          action={async (fd) => {
            "use server";
            try {
              await uploadWebsiteFile(fd);
            } catch (e: any) {
              redirect(`/settings/bestanden?err=${encodeURIComponent(String(e?.message || "Upload mislukt"))}`);
            }
            redirect("/settings/bestanden?saved=1");
          }}
          encType="multipart/form-data"
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          <input name="folder" defaultValue="uploads/files" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold" />
          <input name="files" type="file" multiple required className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold md:col-span-2" />
          <button type="submit" className="rounded-xl bg-[#1e375a] px-4 py-2 text-sm font-black text-white md:col-span-3">
            Uploaden
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-black text-gray-900">Bestandoverzicht ({files.length})</h2>
        <p className="mb-3 text-xs font-bold text-amber-700">Hernoemen/verwijderen wordt geblokkeerd als het bestand nog in gebruik is.</p>
        <div className="space-y-2">
          {files.map((f) => (
            <details key={f} className="rounded-xl border border-gray-200 bg-gray-50">
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-black text-gray-800">
                <div className="flex items-center gap-3">
                  {imageExt.has((f.split(".").pop() || "").toLowerCase()) ? (
                    <img
                      src={srcFor(f)}
                      alt={`Preview ${f}`}
                      className="h-12 w-12 rounded-lg border border-gray-200 bg-white object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white text-[10px] font-black text-gray-500">
                      FILE
                    </div>
                  )}
                  <span className="break-all">Website/{f}</span>
                  {usageMap[f]?.used ? (
                    <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      In gebruik
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-black text-gray-600">
                      Niet gebruikt
                    </span>
                  )}
                </div>
              </summary>
              <div className="border-t border-gray-200 p-3">
                {usageMap[f]?.used ? (
                  <p className="mb-2 text-[11px] font-bold text-emerald-700">
                    Gebruikt in: {usageMap[f].contexts.join(", ")}
                  </p>
                ) : null}
                <form
                  action={async (fd) => {
                    "use server";
                    await renameWebsiteFile(fd);
                    redirect("/settings/bestanden?saved=1");
                  }}
                  className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-3"
                >
                  <input type="hidden" name="oldFile" value={f} />
                  <input name="newName" defaultValue={f.split("/").pop() || ""} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold md:col-span-2" />
                  <button type="submit" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700">
                    Hernoem
                  </button>
                </form>
                <form
                  action={async (fd) => {
                    "use server";
                    await deleteWebsiteFile(fd);
                    redirect("/settings/bestanden?saved=1");
                  }}
                >
                  <input type="hidden" name="file" value={f} />
                  <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                    Verwijder
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      </div>
    </PortalPageShell>
  );
}
