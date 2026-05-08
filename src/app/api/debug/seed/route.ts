import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Debug endpoint mag nooit tijdens `next build` worden geëvalueerd.
export const dynamic = "force-dynamic";

/**
 * Tijdelijke debug route om de eerste admin aan te maken.
 * Bezoek: /api/debug/seed om dit uit te voeren.
 */
export async function GET() {
  try {
    const adminEmail = "mark.mossing.holsteijn@kissfm.nl";
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin bestaat al." });
    }

    const hashedPassword = await bcrypt.hash("KISSFM_ADMIN_2026", 10);

    const newAdmin = await prisma.user.create({
      data: {
        name: "Admin Mark",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Admin succesvol aangemaakt!",
      user: {
        email: newAdmin.email,
        role: newAdmin.role,
        password_hint: "Wachtwoord is: KISSFM_ADMIN_2026",
      },
    });
  } catch (error) {
    console.error("[Seed API] Fout:", error);
    return NextResponse.json(
      { error: "Fout bij aanmaken admin. Is de database gescreëerd (npx prisma db push)?" },
      { status: 500 }
    );
  }
}
