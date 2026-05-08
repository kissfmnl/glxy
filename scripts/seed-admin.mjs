import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.env.DEFAULT_ADMIN_EMAIL;
const password = process.env.DEFAULT_ADMIN_PASSWORD;
const name = process.env.DEFAULT_ADMIN_NAME || "Admin";

async function main() {
  if (!email || !password) {
    console.log(
      "[seed-admin] Skipped: DEFAULT_ADMIN_EMAIL/DEFAULT_ADMIN_PASSWORD not set."
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed-admin] Admin exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`[seed-admin] Admin created: ${email}`);
}

main()
  .catch((e) => {
    console.error("[seed-admin] Failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

