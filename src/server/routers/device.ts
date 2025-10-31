import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { cookies } from "next/headers";
import { getClientIp, getLocationFromIp } from "@/lib/geoip";

export const deviceRouter = createTRPCRouter({
  track: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(), // FingerprintJS visitorId
        deviceMetadata: z
          .object({
            userAgent: z.string().optional(),
            platform: z.string().optional(),
            language: z.string().optional(),
            screenResolution: z.string().optional(),
            timezone: z.string().optional(),
          })
          .optional(),
        location: z
          .object({
            city: z.string().optional(),
            region: z.string().optional(),
            country: z.string().optional(),
            countryCode: z.string().optional(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
            source: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { deviceId, deviceMetadata, location: clientLocation } = input;
      const userId = ctx.session.user.id;

      // Get client IP from headers (server-side, more reliable)
      const headers = ctx.headers;
      const clientIp = headers 
        ? (getClientIp({ headers }) || 
           headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
           headers.get("x-real-ip") ||
           headers.get("cf-connecting-ip") ||
           "unknown")
        : "unknown";

      // If location not provided by client, get it from IP using GeoIP API
      let location = clientLocation;
      if (!location && clientIp !== "unknown") {
        try {
          const locationFromIp = await getLocationFromIp(clientIp);
          if (locationFromIp) {
            location = {
              city: locationFromIp.city,
              region: locationFromIp.region,
              country: locationFromIp.country,
              countryCode: locationFromIp.countryCode,
              latitude: locationFromIp.latitude,
              longitude: locationFromIp.longitude,
              source: locationFromIp.source || "geoip",
            };
          }
        } catch (error) {
          console.error("Error getting location from IP in device tracking:", error);
        }
      }

      // Find existing device by deviceId (fingerprint) - devices are unique per physical device
      // The same device can be used across multiple sessions by the same user
      let device = await ctx.prisma.device.findUnique({
        where: { deviceId },
      });

      // Check if device is revoked (if it belongs to this user)
      if (device && device.revoked && device.userId === userId) {
        // Device is revoked - revoke current session and deny access
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("authjs.session-token")?.value;

        if (sessionToken) {
          await ctx.prisma.session.updateMany({
            where: {
              sessionToken,
              userId,
            },
            data: {
              revoked: true,
              revokeReason: "REVOKED_DEVICE",
              revokedAt: new Date(),
            },
          });
        }

        console.log(
          `Blocked login attempt from revoked device ${deviceId} for user ${userId}`
        );

        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Device has been revoked",
          cause: {
            code: "REVOKED_DEVICE",
            reason: device.revokeReason || "Device access revoked",
          },
        });
      }

      // Prepare device data for update/create
      const deviceData: {
        userId: string;
        deviceId: string;
        deviceFingerprintHash: string;
        userAgent: string | null;
        platform: string | null;
        language: string | null;
        screenResolution: string | null;
        timezone: string | null;
        lastSeenIp: string;
        lastSeen: Date;
        lastSeenLocation?: Prisma.InputJsonValue;
      } = {
        userId,
        deviceId,
        deviceFingerprintHash: deviceId,
        userAgent: deviceMetadata?.userAgent || headers?.get("user-agent") || null,
        platform: deviceMetadata?.platform || null,
        language: deviceMetadata?.language || null,
        screenResolution: deviceMetadata?.screenResolution || null,
        timezone: deviceMetadata?.timezone || null,
        lastSeenIp: clientIp,
        lastSeen: new Date(),
        ...(location && {
          lastSeenLocation: {
            city: location.city,
            region: location.region,
            country: location.country,
            countryCode: location.countryCode,
          },
        }),
      };

      if (device) {
        // Device already exists - reuse it and update last seen info
        // Important: Same physical device can be used by different users (shared computer),
        // but we update the device with current user's info for this session
        
        if (device.userId !== userId) {
          // Device is registered to different user - this is OK for shared devices
          // Update the device to current user for this session, but keep tracking
          // Note: In a production system, you might want to handle this differently
          // (e.g., allow multiple users per device, or show warning)
          console.log(
            `Device ${deviceId} was previously used by user ${device.userId}, now used by ${userId}`
          );
        }

        // Update IP history
        const ipHistory = (device.ipHistory as string[]) || [];
        if (!ipHistory.includes(clientIp)) {
          ipHistory.push(clientIp);
        }

        // Update device with latest info (lastSeen, IP, location, etc.)
        // Note: We update userId in case device was previously used by another user
        // deviceData already contains userId, so we don't need to set it separately
        device = await ctx.prisma.device.update({
          where: { id: device.id },
          data: {
            ...deviceData,
            ipHistory: ipHistory.slice(-10) as any,
          },
        });
      } else {
        // Create new device - this is the first time this physical device is being tracked
        const ipHistory = [clientIp];

        device = await ctx.prisma.device.create({
          data: {
            ...deviceData,
            enrollmentMethod: "OAUTH",
            activated: true,
            ipHistory,
          },
        });

        console.log(
          `Created new device ${device.id} (deviceId: ${deviceId}) for user ${userId}`
        );
      }

      // Link current session to device and store analytics data in database
      // IMPORTANT: JWT tokens only contain essential session data (user id, email, etc.)
      // All analytics data (device, IP, location, coordinates) is stored in DB Session records
      // Note: Session records are created in /api/session/update-org AFTER org selection
      // We only update existing sessions here - never create them
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("authjs.session-token")?.value;

      if (!sessionToken) {
        console.warn(
          `⚠️ No session token found when linking device. User: ${userId}, Device: ${device.id}`
        );
        return {
          success: true,
          deviceId: device.id,
          warning: "No session token found - session not linked",
        };
      }

      // Find or create session - ensure it exists before linking device
      let currentSession = await ctx.prisma.session.findUnique({
        where: {
          sessionToken,
        },
      });

      // Session should already exist (created in /api/session/update-org after org selection)
      // If it doesn't exist, don't create it here - wait for org selection
      // This prevents creating sessions before org is selected
      if (!currentSession) {
        console.warn(
          `⚠️ Session not found for device tracking - waiting for org selection. User: ${userId}, Device: ${device.id}`
        );
        return {
          success: true,
          deviceId: device.id,
          warning: "Session not created yet - will be created after org selection",
        };
      }

      // Verify session belongs to current user and is not revoked
      if (currentSession.userId !== userId) {
        console.warn(
          `⚠️ Session ${currentSession.id} belongs to different user. Expected: ${userId}, Found: ${currentSession.userId}`
        );
        return {
          success: true,
          deviceId: device.id,
          warning: "Session user mismatch - session not linked",
        };
      }

      if (currentSession.revoked) {
        console.warn(
          `⚠️ Session ${currentSession.id} is revoked - not linking device`
        );
        return {
          success: true,
          deviceId: device.id,
          warning: "Session is revoked - session not linked",
        };
      }

      // Update session with device and analytics data (IP, location, GPS)
      // Only update IP/location if session doesn't already have them (preserve initial values)
      await ctx.prisma.session.update({
        where: { id: currentSession.id },
        data: {
          deviceId: device.id,
          // Update IP only if not set yet or if current IP is "unknown"
          ...(currentSession.ip === null || currentSession.ip === "unknown" 
            ? { ip: clientIp !== "unknown" ? clientIp : null } 
            : {}),
          // Update userAgent only if not set yet
          ...(currentSession.userAgent === null && deviceData.userAgent 
            ? { userAgent: deviceData.userAgent } 
            : {}),
          // Update location only if not set yet
          ...(location && !currentSession.locationCity ? {
            location: location.city
              ? `${location.city}, ${
                  location.region || location.country || ""
                }`.trim()
              : null,
            locationCity: location.city || null,
            locationRegion: location.region || null,
            locationCountry: location.country || null,
            locationCountryCode: location.countryCode || null,
            latitude: location.latitude || null,
            longitude: location.longitude || null,
            locationSource: location.source || "geoip",
          } : {}),
        },
      });

      console.log(
        `✅ Linked session ${currentSession.id} to device ${device.id} (deviceId: ${deviceId}) for user ${userId} with IP ${clientIp}`
      );

      return {
        success: true,
        deviceId: device.id,
      };
    }),

  check: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("authjs.session-token")?.value;

    if (!sessionToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No session token",
      });
    }

    // Get current session with device
    const currentSession = await ctx.prisma.session.findFirst({
      where: {
        sessionToken,
        userId,
      },
      include: {
        device: true,
      },
    });

    if (!currentSession) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Session not found",
      });
    }

    // Check if device is revoked
    if (currentSession.device && currentSession.device.revoked) {
      // Revoke the session
      await ctx.prisma.session.update({
        where: { id: currentSession.id },
        data: {
          revoked: true,
          revokeReason: "REVOKED_DEVICE",
          revokedAt: new Date(),
        },
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Device has been revoked",
        cause: {
          revoked: true,
          reason:
            currentSession.device.revokeReason || "Device access revoked",
        },
      });
    }

    return { revoked: false };
  }),

  revokeSession: protectedProcedure
    .input(
      z.object({
        reason: z.string().default("USER_LOGOUT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("authjs.session-token")?.value;

      if (!sessionToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No session token",
        });
      }

      // Revoke current session - find by sessionToken first
      let result = await ctx.prisma.session.updateMany({
        where: {
          sessionToken,
          userId,
          revoked: false, // Only revoke if not already revoked
        },
        data: {
          revoked: true,
          revokeReason: input.reason,
          revokedAt: new Date(),
        },
      });

      // If not found by sessionToken, try to find by userId and update
      if (result.count === 0) {
        result = await ctx.prisma.session.updateMany({
          where: {
            userId,
            revoked: false,
            expires: {
              gt: new Date(), // Only active sessions
            },
          },
          data: {
            revoked: true,
            revokeReason: input.reason,
            revokedAt: new Date(),
          },
        });
      }

      console.log(
        `Revoked ${result.count} session(s) for user ${userId} with reason: ${input.reason}`
      );

      return { success: true, count: result.count };
    }),

  // Check if current session is valid (for middleware/API routes)
  // This is a public procedure that can be called without full auth context
  checkSession: publicProcedure.query(async ({ ctx }) => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("authjs.session-token")?.value;

    if (!sessionToken) {
      return {
        valid: false,
        reason: "NO_SESSION_TOKEN",
      };
    }

    // Find session by token
    const session = await ctx.prisma.session.findUnique({
      where: {
        sessionToken,
      },
      include: {
        device: true,
      },
    });

    // If session doesn't exist in DB, allow through (session will be created)
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
      await ctx.prisma.session.update({
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
      await ctx.prisma.session.update({
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
    };
  }),
});

