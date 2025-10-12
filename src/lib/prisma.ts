import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pool settings for Supabase
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown - only in Node.js environments where process.on is available
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("beforeExit", async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Error disconnecting Prisma:", error);
    }
  });
}
