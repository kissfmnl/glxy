import { PrismaClient } from "@prisma/client";

// Patroon: Prisma Client Singleton voor Next.js
// Dit voorkomt dat er bij elke hot-reload (in development) een nieuwe database-verbinding
// wordt aangemaakt, wat tot "Too many connections" errors kan leiden.
// Zie: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-prisma-client-dev-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
