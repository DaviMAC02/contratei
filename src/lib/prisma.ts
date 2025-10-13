import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure we're using the pooled connection for Supabase in production
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Log connection details for debugging (without exposing password)
  if (process.env.NODE_ENV === "development") {
    const url = new URL(dbUrl);
    console.log(`Prisma connecting to: ${url.hostname}:${url.port}`);
  }

  return dbUrl;
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
        url: getDatabaseUrl(),
      },
    },
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
