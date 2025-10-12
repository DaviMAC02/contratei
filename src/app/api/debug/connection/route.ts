import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    console.log("Testing database connection...");
    console.log("DATABASE_URL configured:", !!process.env.DATABASE_URL);
    console.log("Runtime:", process.env.VERCEL_REGION ? "Vercel" : "Local");

    // Simple database test
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      result,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        runtime: process.env.VERCEL_REGION ? "Vercel" : "Local",
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV,
          runtime: process.env.VERCEL_REGION ? "Vercel" : "Local",
        },
      },
      { status: 500 }
    );
  }
}
