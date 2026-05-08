import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isKiss40EditorEmail } from "@/lib/kiss40Access";
import { parsePortalPermissionsJson } from "@/lib/portalPermissions";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "KISS FM Portaal",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "dj@kissfm.nl" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Ongeldige inloggegevens");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Gebruiker niet gevonden");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Wachtwoord onjuist");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          portalPermissions: parsePortalPermissionsJson(user.permissionsJson),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.portalPermissions = (user as any).portalPermissions || [];
      }
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true, permissionsJson: true, email: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.portalPermissions = parsePortalPermissionsJson(fresh.permissionsJson);
          token.email = fresh.email ?? token.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        let role = token.role as string | undefined;
        let email = session.user.email ?? (token.email as string | undefined);
        let portalPermissions = (token as any).portalPermissions || [];

        if (token.id) {
          const fresh = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: { role: true, email: true, permissionsJson: true },
          });
          if (fresh) {
            role = fresh.role;
            email = fresh.email ?? email;
            portalPermissions = parsePortalPermissionsJson(fresh.permissionsJson);
          }
        }

        (session.user as any).role = role;
        (session.user as any).id = token.id;
        session.user.email = email ?? null;
        (session.user as any).portalPermissions = portalPermissions;
        (session.user as any).kiss40Editor =
          role === "ADMIN" || isKiss40EditorEmail(email ?? undefined);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
