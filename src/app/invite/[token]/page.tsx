import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { InviteAcceptForm } from "./InviteAcceptForm";

type Props = { params: { token: string } };

export default async function InviteAcceptPage(props: Props) {
  const token = props.params.token ?? "";

  let email: string | null = null;
  let usable = false;
  let headline = "Uitnodiging";
  let body = "";

  if (token) {
    try {
      const invite = await prisma.invite.findUnique({ where: { token } });
      if (!invite) {
        headline = "Link ongeldig";
        body = "Deze uitnodigingslink bestaat niet (meer).";
      } else if (invite.usedAt) {
        headline = "Link al gebruikt";
        body = "Met deze link is al een account aangemaakt. Log in via de loginpagina.";
      } else if (invite.expiresAt < new Date()) {
        headline = "Link verlopen";
        body = "Vraag een nieuwe uitnodiging bij een beheerder.";
      } else {
        usable = true;
        email = invite.email;
      }
    } catch {
      headline = "Geen verbinding met database";
      body = "Controleer of DATABASE_URL ingesteld is en `npx prisma db push` heeft gedraaid.";
    }
  } else {
    headline = "Ontbrekende token";
    body = "";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 glxy-public-bg">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/45 p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)] backdrop-blur-xl">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.35em] text-[#00f0ff]/80">GLXY Radio</p>
        <h1 className="mt-3 text-center text-2xl font-black text-white">{headline}</h1>
        {body ? <p className="mt-3 text-center text-sm font-semibold text-white/65">{body}</p> : null}

        {usable && email ? (
          <InviteAcceptForm token={token} email={email} />
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--brand-primary)]/90 to-[var(--brand-accent)]/90 px-4 py-3 text-sm font-black text-[#070b14]"
            >
              Naar inloggen
            </Link>
            <Link
              href="/"
              className="inline-flex w-full justify-center rounded-2xl border border-white/20 py-3 text-sm font-black text-white/90 hover:bg-white/5"
            >
              Naar homepage
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
