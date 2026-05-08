import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { hasPortalPermission } from "@/lib/portalPermissions";
import { importSiteBackup } from "@/app/actions/siteBackupActions";

export default async function SiteBackupPage({
  searchParams,
}: {
  searchParams?: { saved?: string; err?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "manageSiteSettings")) redirect("/settings");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/settings");

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <Link
        href="/settings/site"
        className="inline-flex items-center gap-2 text-sm font-black text-brand-primary transition-colors hover:text-brand-primary/80"
      >
        ← Terug naar site instellingen
      </Link>

      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Backup &amp; herstel</h1>
        <p className="mt-2 max-w-3xl text-sm font-bold text-gray-600 dark:text-white/70">
          Exporteer inhoud die via de admin beheerd wordt (DJ&apos;s, programmering, site-teksten, concerten, Join KISS, KISS40, studio-boekingen, enz.).{" "}
          <strong className="text-gray-900 dark:text-white">Import overschrijft</strong> die gegevens in de database — gebruikersaccounts en WhatsApp-berichten blijven buiten de backup.
        </p>
      </div>

      {searchParams?.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Import voltooid. Pagina&apos;s zijn ververst.
        </div>
      ) : null}
      {searchParams?.err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800">
          {decodeURIComponent(searchParams.err)}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card md:p-8">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Backup downloaden</h2>
          <p className="mt-2 text-sm font-bold text-gray-600 dark:text-white/65">
            Eén JSON-bestand met de meeste website- en contentdata. Bestanden op schijf (foto&apos;s) blijven staan; in de backup staan de paden ernaar.
          </p>
          <a
            href="/api/admin/site-backup"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#1e375a] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#2a4a73]"
          >
            Download backup (.json)
          </a>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/20 md:p-8">
          <h2 className="text-lg font-black text-amber-950 dark:text-amber-100">Backup terugzetten</h2>
          <p className="mt-2 text-sm font-bold text-amber-950/90 dark:text-amber-100/90">
            Kies een eerder gedownload <code className="rounded bg-white/70 px-1 py-0.5 text-xs dark:bg-black/30">kissfm-site-backup-….json</code>. Dit wist de huidige inhoud in de genoemde tabellen en zet de backup erin.
          </p>
          <form
            className="mt-4 space-y-4"
            action={async (formData) => {
              "use server";
              const res = await importSiteBackup(formData);
              if (!res.success) {
                redirect(`/settings/backup?err=${encodeURIComponent(res.error)}`);
              }
              redirect("/settings/backup?saved=1");
            }}
          >
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-amber-900/80 dark:text-amber-200/80">
                Backupbestand
              </label>
              <input name="backupFile" type="file" accept="application/json,.json" required className="w-full text-sm font-bold" />
            </div>
            <label className="flex items-start gap-2 text-sm font-black text-amber-950 dark:text-amber-50">
              <input type="checkbox" name="importConfirm" className="mt-1 accent-brand-primary" />
              <span>Ik weet dat import bestaande inhoud overschrijft (behalve gebruikersaccounts).</span>
            </label>
            <button type="submit" className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700">
              Importeer backup
            </button>
          </form>
        </div>
      </div>
    </PortalPageShell>
  );
}
