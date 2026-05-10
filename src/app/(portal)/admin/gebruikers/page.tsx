import { authOptions } from "@/lib/auth";
import { isPortalAdmin } from "@/lib/authRoles";
import { prisma } from "@/lib/prisma";
import { InviteCreateForm } from "./InviteCreateForm";
import type { Invite, User } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gebruikers — GLXY",
};

function fmtDate(d: Date) {
  return d.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminGebruikersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPortalAdmin(session.user.role)) redirect("/dashboard");

  let invites: Invite[] = [];
  let users: Pick<User, "id" | "email" | "role" | "name" | "createdAt">[] = [];

  try {
    [invites, users] = await Promise.all([
      prisma.invite.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, email: true, role: true, name: true, createdAt: true },
      }),
    ]);
  } catch {
    invites = [];
    users = [];
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-main)]">Gebruikers & uitnodigingen</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Alleen beheerders kunnen uitnodigingen aanmaken. Na acceptatie verschijnt het account in de lijst.
        </p>
      </header>

      <InviteCreateForm />

      <section className="card border border-white/10 bg-white/[0.04] backdrop-blur">
        <h2 className="text-lg font-black text-[var(--text-main)]">Accounts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-wider text-white/45">
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Naam</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-[var(--text-muted)]">
                    Nog geen gebruikers. Maak een bootstrap-admin via <code className="text-cyan-200/90">ADMIN_BOOTSTRAP_EMAIL</code> + seed, of nodig iemand uit.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 text-[var(--text-main)]">
                    <td className="py-2 pr-3 font-semibold">{u.email}</td>
                    <td className="py-2 pr-3 text-[var(--text-muted)]">{u.name ?? "—"}</td>
                    <td className="py-2 pr-3 font-black text-cyan-200/90">{u.role}</td>
                    <td className="py-2 text-[var(--text-muted)]">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card border border-white/10 bg-white/[0.04] backdrop-blur">
        <h2 className="text-lg font-black text-[var(--text-main)]">Uitnodigingen</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-wider text-white/45">
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2 pr-3">Verloopt</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-[var(--text-muted)]">
                    Geen uitnodigingen in de database.
                  </td>
                </tr>
              ) : (
                invites.map((i) => {
                  const used = Boolean(i.usedAt);
                  const expired = i.expiresAt < new Date() && !used;
                  const status = used ? "Gebruikt" : expired ? "Verlopen" : "Open";
                  return (
                    <tr key={i.id} className="border-b border-white/5 text-[var(--text-main)]">
                      <td className="py-2 pr-3 font-semibold">{i.email}</td>
                      <td className="py-2 pr-3 font-black text-cyan-200/90">{i.role}</td>
                      <td className="py-2 pr-3 text-[var(--text-muted)]">{fmtDate(i.expiresAt)}</td>
                      <td className="py-2 text-[var(--text-muted)]">{status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
