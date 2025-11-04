import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getDatabaseUrl = () => {
  // Use connection pooler URL in production (Vercel/serverless)
  // Use direct URL in development
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const url = new URL(dbUrl);
  return url.toString();
};

// Prisma Client configuration for serverless environments
const createPrismaClient = () => {
  return new PrismaClient({
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
};

// Cache Prisma client globally to prevent connection exhaustion
// CRITICAL: Must cache in production too for serverless environments
export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // In production (Vercel), cache globally to reuse connections
  globalForPrisma.prisma = prisma;
}

// Global error handlers to prevent crashes
if (typeof process !== "undefined" && typeof process.on === "function") {
  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Don't exit the process, just log the error
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    // Don't exit immediately, let the error handler deal with it
  });

  // Graceful shutdown
  process.on("beforeExit", async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Error disconnecting Prisma:", error);
    }
  });

  // Handle SIGTERM (Vercel uses this)
  process.on("SIGTERM", async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Error disconnecting Prisma on SIGTERM:", error);
    }
    process.exit(0);
  });
}
