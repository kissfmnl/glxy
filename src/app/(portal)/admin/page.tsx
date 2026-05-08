import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUser, deleteUser, updateUser } from "@/app/actions/userActions";
import { redirect } from "next/navigation";
import { PortalPageShell } from "@/components/portal/PortalPageShell";
import Link from "next/link";
import {
  DEFAULT_DJ_PERMISSIONS,
  PORTAL_PERMISSION_KEYS,
  PORTAL_PERMISSION_LABELS,
  parsePortalPermissionsJson,
} from "@/lib/portalPermissions";

function PermissionGrid({ selected }: { selected: Set<string> }) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
      {PORTAL_PERMISSION_KEYS.map((key) => (
        <label key={key} className="inline-flex items-center gap-2 text-xs font-bold text-gray-700">
          <input type="checkbox" name="permissions" value={key} defaultChecked={selected.has(key)} className="accent-brand-primary" />
          {PORTAL_PERMISSION_LABELS[key]}
        </label>
      ))}
    </div>
  );
}

function getDisplayedPermissions(role: string, permissionsJson: string | null): Set<string> {
  const parsed = parsePortalPermissionsJson(permissionsJson ?? "");
  // Legacy correction: some DJ accounts were accidentally saved with all permissions.
  if (role === "DJ" && parsed.length === PORTAL_PERMISSION_KEYS.length) {
    return new Set(DEFAULT_DJ_PERMISSIONS);
  }
  return new Set(parsed);
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/settings");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <PortalPageShell width="wide" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Gebruikers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Maak accounts aan voor dj&apos;s of andere admins.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/admin/inzendingen?tab=playlist" className="inline-flex rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-700">
            Naar inzendingen & stemmen
          </Link>
          <Link href="/admin/acties" className="inline-flex rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-700">
            Naar actie nummerbeheer
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-premium">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-6">Nieuwe gebruiker</h2>
            <form
              action={async (formData) => {
                "use server";
                await createUser(formData);
                redirect("/admin?saved=1");
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Volledige naam</label>
                  <input name="name" type="text" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all" placeholder="bijv. Mark Mossing"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">E-mailadres</label>
                  <input name="email" type="email" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all" placeholder="dj@kissfm.nl"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Wachtwoord</label>
                  <input name="password" type="password" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Rol</label>
                  <select name="role" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                    <option value="DJ">DJ / Moderator</option>
                    <option value="ADMIN">Systeem admin</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Toegang sidebar & instellingen (voor DJ/Moderator)</label>
                  <PermissionGrid selected={new Set()} />
                </div>
              </div>
              <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 rounded-xl shadow-lg shadow-brand-primary/20 transition-all">
                Account aanmaken
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-premium">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Systeem debug</h2>
            <p className="text-xs text-gray-500 mb-6 font-medium">Gebruik deze tools voor het testen van de interface.</p>

            <form action="/api/debug/mock-messages" method="POST">
              <button type="submit" className="w-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Genereer mock berichten
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Bestaande accounts ({users.length})</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {users.map((user) => (
              <details key={user.id} className="p-5 bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-2xl group hover:border-brand-primary/30 transition-all shadow-sm hover:shadow-md">
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 font-bold group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                      {user.name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user.name}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>
                    </div>
                  </div>
                </summary>

                <form
                  action={async (formData) => {
                    "use server";
                    await updateUser(formData);
                    redirect("/admin?saved=1");
                  }}
                  className="mt-3 border-t border-gray-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <input type="hidden" name="id" value={user.id} />
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Naam</label>
                    <input name="name" defaultValue={user.name ?? ""} required className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">E-mailadres</label>
                    <input name="email" type="email" defaultValue={user.email ?? ""} required className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Rol</label>
                    <select name="role" defaultValue={user.role} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold">
                      <option value="DJ">DJ</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Wachtwoord</label>
                    <input name="password" type="text" placeholder="Nieuw wachtwoord (optioneel)" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold" />
                    <p className="mt-1 text-[10px] font-bold text-gray-500">Bestaande wachtwoorden zijn beveiligd gehasht en niet leesbaar.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Toegang sidebar & instellingen (voor DJ/Moderator)</label>
                    <PermissionGrid selected={getDisplayedPermissions(user.role, user.permissionsJson)} />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <button type="submit" className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-black">
                      Opslaan
                    </button>
                    {user.id !== (session.user as any).id ? (
                      <button
                        type="submit"
                        formAction={async () => {
                          "use server";
                          await deleteUser(user.id);
                          redirect("/admin?saved=1");
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black text-red-500 bg-red-50 border border-red-200"
                      >
                        Verwijder
                      </button>
                    ) : null}
                  </div>
                </form>
              </details>
            ))}
          </div>
        </div>
      </div>
    </PortalPageShell>
  );
}

