import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import { prisma } from "@/lib/prisma";
import { AdminJockFactsEditor } from "@/components/portal/AdminJockFactsEditor";
import { updateOwnJockProfile } from "@/app/actions/scheduleActions";
import { hasPortalPermission } from "@/lib/portalPermissions";

export default async function MyJockProfilePage({ searchParams }: { searchParams?: { saved?: string; error?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!hasPortalPermission(session, "editOwnJockProfile")) redirect("/dashboard");

  const userName = String((session.user as any)?.name || "").trim();
  const jock = await prisma.jock.findFirst({
    where: { name: { equals: userName, mode: "insensitive" } },
    select: { id: true, name: true, bioText: true, personalFactsJson: true },
  });

  if (!jock) {
    return (
      <PortalPageShell width="default">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
          Geen DJ-profiel gevonden met jouw accountnaam. Laat een admin je accountnaam gelijk zetten aan je DJ-naam.
        </div>
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell width="default" className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mijn DJ-profiel</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pas je bio en fun facts aan voor je publieke DJ-pagina.
        </p>
      </div>
      {searchParams?.saved === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Opgeslagen.
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800">
          {searchParams.error}
        </div>
      ) : null}
      <form
        action={async (formData) => {
          "use server";
          const result = await updateOwnJockProfile(formData);
          if (!result.success) {
            redirect(`/dashboard/mijn-profiel?error=${encodeURIComponent(result.error || "Opslaan mislukt")}`);
          }
          redirect("/dashboard/mijn-profiel?saved=1");
        }}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6"
      >
        <input type="hidden" name="jockId" value={jock.id} />
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DJ info / bio</label>
        <textarea
          name="bioText"
          defaultValue={jock.bioText ?? ""}
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900"
        />
        <div className="mt-4">
          <AdminJockFactsEditor initialJson={jock.personalFactsJson} />
        </div>
        <button
          type="submit"
          className="mt-5 rounded-xl bg-brand-primary px-5 py-3 text-sm font-black text-white shadow-md hover:opacity-95"
        >
          Opslaan
        </button>
      </form>
    </PortalPageShell>
  );
}
