import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const url = new URL(dbUrl);

  return url.toString();
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log:
    //   process.env.NODE_ENV === "development"
    //     ? ["query", "error", "warn"]
    //     : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

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
