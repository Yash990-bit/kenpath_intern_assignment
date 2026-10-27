import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances in Next.js dev mode (hot reload creates
// new module instances on every save, but we want ONE shared connection pool).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
