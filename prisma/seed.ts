import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.branding.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      primaryHex: "#22d3ee",
      accentHex: "#c084fc",
      navyHex: "#0f172a",
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
