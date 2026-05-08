import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { getFaviconSettings, resetSiteFaviconToDefault, uploadSiteFavicon } from "@/app/actions/faviconActions";
import { hasPortalPermission } from "@/lib/portalPermissions";
import AppImage from "@/components/AppImage";

export default async function FaviconSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");

  const { currentPath, defaultPath } = await getFaviconSettings();

  return (
    <PortalPageShell width="readable">
      <Link
        href="/settings/site"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>
      <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Favicon</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-white/65">
        De site gebruikt nu standaard de KISS-lippen als favicon. Upload hier een nieuwe om die te overschrijven.
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
        <div className="mb-5 flex items-center gap-4">
          <AppImage src="/api/favicon" alt="Huidige favicon" className="h-10 w-10 rounded-lg border border-gray-200 object-contain p-1 dark:border-white/10" />
          <div className="text-xs text-gray-600 dark:text-white/60">
            <p>
              Huidig pad: <span className="font-semibold">{currentPath || `(standaard) ${defaultPath}`}</span>
            </p>
            <p>Actueel icoon: wordt geladen via `/api/favicon`.</p>
          </div>
        </div>

        <form
          action={async (formData) => {
            "use server";
            await uploadSiteFavicon(formData);
            redirect("/settings/favicon?saved=1");
          }}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            Nieuw favicon bestand
            <input
              name="file"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.avif,.svg,.ico,image/*"
              className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-brand-primary/90 dark:border-white/15 dark:bg-white/[0.03] dark:text-white"
              required
            />
          </label>
          <button className="h-10 rounded-full bg-brand-primary px-5 text-sm font-black text-white transition hover:bg-brand-primary/90 active:scale-[0.99]">
            Favicon opslaan
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await resetSiteFaviconToDefault();
            redirect("/settings/favicon?saved=1");
          }}
          className="mt-4"
        >
          <button className="h-10 rounded-full border border-gray-300 px-5 text-sm font-black text-gray-800 transition hover:bg-gray-100 active:scale-[0.99] dark:border-white/20 dark:text-white dark:hover:bg-white/10">
            Terug naar standaard (KISS-lippen)
          </button>
        </form>
      </div>
    </PortalPageShell>
  );
}
