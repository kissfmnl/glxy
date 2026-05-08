import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Deze seed hoort GEEN nep-concerten meer te maken.
  // Rebuilds/startup draaien dit script altijd, dus we ruimen oude testdata op.
  const legacyTitles = ["KISS FM Live Night", "KISS Throwback Party", "KISS40 On Tour"];
  const deleted = await prisma.concert.deleteMany({
    where: {
      title: { in: legacyTitles },
    },
  });

  console.log(`[seed-concerts] OK: removed ${deleted.count} legacy test concerts; no demo concerts seeded`);
}

main()
  .catch((e) => {
    console.error("[seed-concerts] Failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
