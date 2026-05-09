import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.branding.upsert({
    where: { id: 1 },
    create: {
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
      homeHlsUrl: "https://mistserv4.videostreams.nl/hls/camfactor/index.m3u8",
    },
    update: {},
  });

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const count = await prisma.user.count();
  if (!count && email && password && password.length >= 8) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.ADMIN,
        name: "Administrator",
      },
    });
    // eslint-disable-next-line no-console
    console.info(`Bootstrap admin created: ${email}`);
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
