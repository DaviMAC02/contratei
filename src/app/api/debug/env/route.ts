import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;

    // Extract connection details without exposing the password
    const parseUrl = (url: string | undefined) => {
      if (!url) return null;

      try {
        const parsed = new URL(url);
        return {
          host: parsed.hostname,
          port: parsed.port,
          database: parsed.pathname.replace("/", ""),
          searchParams: Object.fromEntries(parsed.searchParams.entries()),
          hasPassword: !!parsed.password,
          username: parsed.username,
        };
      } catch (error) {
        return { error: "Invalid URL format" };
      }
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        vercelRegion: process.env.VERCEL_REGION,
        runtime: process.env.VERCEL_REGION ? "Vercel" : "Local",
        hasDbUrl: !!dbUrl,
        hasDirectUrl: !!directUrl,
      },
      connectionDetails: {
        DATABASE_URL: parseUrl(dbUrl),
        DIRECT_URL: parseUrl(directUrl),
      },
    });
  } catch (error) {
    console.error("Env debug error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
