import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Invalidate stale PrismaClient in dev memory if SystemSetting model was recently added
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).systemSetting) {
  try {
    globalForPrisma.prisma.$disconnect();
  } catch (_) {}
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
