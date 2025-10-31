import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createCaller } from "@/server/root";
import { getClientIp, getLocationFromIp } from "@/lib/geoip";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, gpsCoordinates } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const membership = await prisma.orgMember.findFirst({
      where: {
        userId: session.user.id,
        orgId: orgId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const clientIp = getClientIp(request) || "unknown";
    let locationData = null;

    if (clientIp !== "unknown") {
      try {
        locationData = await getLocationFromIp(clientIp);
      } catch (error) {
        console.error("Error getting location from IP:", error);
      }
    }

    const userAgent = request.headers.get("user-agent") || null;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("authjs.session-token")?.value;

    if (sessionToken) {
      const existingSession = await prisma.session.findUnique({
        where: { sessionToken },
      });

      if (!existingSession) {
        const caller = await createCaller({ session });

        const result = await caller.auth.createSession({
          ip: clientIp !== "unknown" ? clientIp : undefined,
          userAgent: userAgent || undefined,
          location: locationData
            ? {
                city: locationData.city,
                region: locationData.region,
                country: locationData.country,
                countryCode: locationData.countryCode,
                latitude: gpsCoordinates?.latitude || locationData.latitude,
                longitude: gpsCoordinates?.longitude || locationData.longitude,
                source: gpsCoordinates
                  ? "gps"
                  : locationData?.source || "geoip",
              }
            : gpsCoordinates
            ? {
                latitude: gpsCoordinates.latitude,
                longitude: gpsCoordinates.longitude,
                source: "gps",
              }
            : undefined,
        });

        console.log(
          `Session ${result.sessionId} created for user ${session.user.id} (revoked ${result.revokedOtherSessions} other sessions)`
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      orgId,
      shouldUpdateSession: true
    });
  } catch (error) {
    console.error("Error updating org in session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
