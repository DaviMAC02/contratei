import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function checkSessionValidity() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("authjs.session-token")?.value;

  if (!sessionToken) {
    return {
      valid: false,
      reason: "NO_SESSION_TOKEN",
    };
  }

  // Find session by token
  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
    },
    include: {
      device: true,
    },
  });

  // If session doesn't exist in DB, it might be a new login
  // Allow it through - session creation will happen in auth-complete layout
  // This prevents blocking legitimate new sessions
  if (!session) {
    return {
      valid: true, // Allow through - session will be created
      reason: "SESSION_NOT_IN_DB_YET",
      sessionId: null,
    };
  }

  // Check if session is revoked
  if (session.revoked) {
    return {
      valid: false,
      reason: "SESSION_REVOKED",
      revokeReason: session.revokeReason || "Unknown",
    };
  }

  // Check if session is expired
  if (session.expires < new Date()) {
    // Mark as revoked if expired
    await prisma.session.update({
      where: { id: session.id },
      data: {
        revoked: true,
        revokeReason: "SESSION_EXPIRED",
        revokedAt: new Date(),
      },
    });

    return {
      valid: false,
      reason: "SESSION_EXPIRED",
    };
  }

  // Check if device is revoked
  if (session.device && session.device.revoked) {
    // Revoke the session if device is revoked
    await prisma.session.update({
      where: { id: session.id },
      data: {
        revoked: true,
        revokeReason: "REVOKED_DEVICE",
        revokedAt: new Date(),
      },
    });

    return {
      valid: false,
      reason: "REVOKED_DEVICE",
      revokeReason: session.device.revokeReason || "Device access revoked",
    };
  }

  // Session is valid
  return {
    valid: true,
    sessionId: session.id,
    userId: session.userId,
    deviceId: session.deviceId,
    expires: session.expires,
  };
}

