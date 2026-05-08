import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function hhmm(t) {
  // accept "00:00 - 07:00" style splitting is handled elsewhere
  return t;
}

async function upsertJock({ name, slug, imagePath, isActive = true }) {
  const finalSlug = slug || slugify(name);
  const existing = await prisma.jock.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    // Non-destructive: bewaar bestaande geuploade foto- en profieldata.
    return prisma.jock.update({
      where: { id: existing.id },
      data: { name, isActive },
    });
  }
  return prisma.jock.create({
    data: { name, slug: finalSlug, imagePath: imagePath ?? null, isActive },
  });
}

async function upsertSlot({ dayOfWeek, startTime, endTime, label, notes, jockId }) {
  // make slot idempotent by unique composite "day+start+end"
  const existing = await prisma.scheduleSlot.findFirst({
    where: { dayOfWeek, startTime, endTime },
    select: { id: true },
  });
  if (existing) {
    // Non-destructive: laat bestaande (handmatig aangepaste) programmering intact.
    return prisma.scheduleSlot.findUnique({ where: { id: existing.id } });
  }
  return prisma.scheduleSlot.create({
    data: {
      dayOfWeek,
      startTime,
      endTime,
      label: label ?? null,
      notes: notes ?? null,
      jockId,
    },
  });
}

async function main() {
  // Jocks mapping (match file names)
  const jocks = {
    nonstop: await upsertJock({
      name: "KISS non-stop",
      slug: "nonstop",
      imagePath: null,
      isActive: true,
    }),
    quinten: await upsertJock({
      name: "Quinten van Hilten",
      slug: "quinten-van-hilten",
      imagePath: "Website/Jockfotos/quintenvanhilten.png",
      isActive: true,
    }),
    charlotte: await upsertJock({
      name: "Charlotte Sun",
      slug: "charlotte-sun",
      imagePath: null,
      isActive: true,
    }),
    dimitris: await upsertJock({
      name: "Dimitris Kops",
      slug: "dimitris-kops",
      imagePath: "Website/Jockfotos/dimitriskops.png",
      isActive: true,
    }),
    ferry: await upsertJock({
      name: "Ferry Oomen",
      slug: "ferry-oomen",
      imagePath: "Website/Jockfotos/ferryoomen.png",
      isActive: true,
    }),
    sjoerd: await upsertJock({
      name: "Sjoerd de Graaff",
      slug: "sjoerd-de-graaff",
      imagePath: "Website/Jockfotos/sjoerddegraaff.png",
      isActive: true,
    }),
    robin: await upsertJock({
      name: "Robin Boogaarts",
      slug: "robin-boogaarts",
      imagePath: "Website/Jockfotos/robinboogaarts.png",
      isActive: true,
    }),
    stefan: await upsertJock({
      name: "Stefan Brau",
      slug: "stefan-brau",
      imagePath: "Website/Jockfotos/stefanbrau.png",
      isActive: true,
    }),
    bas: await upsertJock({
      name: "Bas van Teylingen",
      slug: "bas-van-teylingen",
      imagePath: "Website/Jockfotos/basvanteylingen.png",
      isActive: true,
    }),
    dennis: await upsertJock({
      name: "Dennis Rodrigues",
      slug: "dennis-rodrigues",
      imagePath: "Website/Jockfotos/dennisrodrigues.png",
      isActive: true,
    }),
  };

  // Weekdays: 1-5
  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    await upsertSlot({
      dayOfWeek,
      startTime: "00:00",
      endTime: "07:00",
      label: "KISS non-stop",
      jockId: jocks.nonstop.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "07:00",
      endTime: "10:00",
      label: "Wake Up KISS",
      notes: "Quinten van Hilten & Charlotte Sun",
      jockId: jocks.quinten.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "10:00",
      endTime: "15:00",
      label: null,
      jockId: jocks.dimitris.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "15:00",
      endTime: "18:00",
      label: "KISS & Ride",
      notes: "Ferry Oomen",
      jockId: jocks.ferry.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "18:00",
      endTime: "21:00",
      label: null,
      jockId: jocks.sjoerd.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "21:00",
      endTime: "00:00",
      label: "KISS non-stop",
      jockId: jocks.nonstop.id,
    });
  }

  // Weekend: 6-7
  for (const dayOfWeek of [6, 7]) {
    await upsertSlot({
      dayOfWeek,
      startTime: "00:00",
      endTime: "10:00",
      label: "KISS non-stop",
      jockId: jocks.nonstop.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "10:00",
      endTime: "13:00",
      label: null,
      jockId: jocks.robin.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "13:00",
      endTime: "16:00",
      label: null,
      jockId: jocks.stefan.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "16:00",
      endTime: "18:00",
      label: "KISS40",
      notes: "Bas van Teylingen",
      jockId: jocks.bas.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "18:00",
      endTime: "21:00",
      label: null,
      jockId: jocks.dennis.id,
    });
    await upsertSlot({
      dayOfWeek,
      startTime: "21:00",
      endTime: "00:00",
      label: "KISS non-stop",
      jockId: jocks.nonstop.id,
    });
  }

  console.log("[seed-schedule] OK: jocks + schedule upserted");
}

main()
  .catch((e) => {
    console.error("[seed-schedule] Failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

