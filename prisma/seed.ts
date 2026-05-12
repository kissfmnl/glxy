import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  /** Alleen aanmaken als er nog geen branding is — zo overschrijft elke `db seed` géén logo/URLs meer in productie. */
  const existingBranding = await prisma.branding.findUnique({ where: { id: 1 } });
  if (!existingBranding) {
    await prisma.branding.create({
      data: {
        id: 1,
        primaryHex: "#0b7557",
        accentHex: "#6d6d6d",
        navyHex: "#363636",
        yellowHex: "#ffe200",
        navItems: [
          { href: "/", label: "Home" },
          { href: "/glxy-tv", label: "GLXY TV" },
          { href: "/playlist", label: "Playlist" },
          { href: "/adverteren", label: "Adverteren" },
          { href: "/drop-n-demo", label: "Drop 'n Demo" },
          { href: "/passdeaux", label: "Passdeaux" },
          { href: "/airplay-top-20", label: "Airplay Top 20" },
          { href: "/frequenties", label: "Frequenties" },
          { href: "/press", label: "Press" },
        ],
        instagramUrl: "https://instagram.com",
        tiktokUrl: "https://www.tiktok.com",
        menuBarHex: "#052e22",
        heroVideoFrameHex: "#ffe200",
        listenBarBgHex: "#0b7557",
        listenBarTextHex: "#ffffff",
        stationColors: {
          z1: "#0b7557",
          z2: "#111816",
          z3: "#eab308",
          z4: "#064e3b",
        },
        homeHlsUrl: "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8",
      },
    });
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const count = await prisma.user.count();
  const bootstrapRole =
    process.env.ADMIN_BOOTSTRAP_ROLE?.trim().toUpperCase() === "SUPER_ADMIN" ? Role.SUPER_ADMIN : Role.ADMIN;
  if (!count && email && password && password.length >= 8) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: bootstrapRole,
        name: bootstrapRole === Role.SUPER_ADMIN ? "Super-admin" : "Administrator",
      },
    });
    // eslint-disable-next-line no-console
    console.info(`Bootstrap admin created: ${email}`);
  }

  /** Bestaand account promoveren naar super-admin (uitbreidbaar via env). */
  const promoteEmail =
    process.env.GLXY_PROMOTE_SUPER_ADMIN_EMAIL?.trim().toLowerCase() || "ferry.oomen@kissfm.nl";
  const promoted = await prisma.user.updateMany({
    where: { email: promoteEmail },
    data: { role: Role.SUPER_ADMIN },
  });
  if (promoted.count > 0) {
    // eslint-disable-next-line no-console
    console.info(`Role SUPER_ADMIN applied to: ${promoteEmail}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
