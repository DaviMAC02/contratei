import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
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

      const headers = ctx.headers;
      const clientIp = headers
        ? getClientIp({ headers }) ||
          headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          headers.get("x-real-ip") ||
          headers.get("cf-connecting-ip") ||
          "unknown"
        : "unknown";

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
          console.error(
            "Error getting location from IP in device tracking:",
            error
          );
        }
      }

      let device = await ctx.prisma.device.findUnique({
        where: { deviceId },
      });

      if (device && device.revoked && device.userId === userId) {
        const sessionToken = ctx.session.dbSessionId; // Use stable session ID from JWT

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
        userAgent:
          deviceMetadata?.userAgent || headers?.get("user-agent") || null,
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
        if (device.userId !== userId) {
          console.log(
            `Device ${deviceId} was previously used by user ${device.userId}, now used by ${userId}`
          );
        }

        const ipHistory = (device.ipHistory as string[]) || [];
        if (!ipHistory.includes(clientIp)) {
          ipHistory.push(clientIp);
        }

        device = await ctx.prisma.device.update({
          where: { id: device.id },
          data: {
            ...deviceData,
            ipHistory: ipHistory.slice(-10) as any,
          },
        });
      } else {
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

      const sessionToken = ctx.session.dbSessionId; // Use stable session ID from JWT

      if (!sessionToken) {
        console.warn(
          `⚠️ No session ID in JWT when linking device. User: ${userId}, Device: ${device.id}`
        );
        return {
          success: true,
          deviceId: device.id,
          warning: "No session ID in JWT - session not linked",
        };
      }

      let currentSession = await ctx.prisma.session.findUnique({
        where: {
          sessionToken,
        },
      });

      if (!currentSession) {
        console.warn(
          `⚠️ Session not found for device tracking - waiting for org selection. User: ${userId}, Device: ${device.id}`
        );
        return {
          success: true,
          deviceId: device.id,
          warning:
            "Session not created yet - will be created after org selection",
        };
      }

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

      await ctx.prisma.session.update({
        where: { id: currentSession.id },
        data: {
          deviceId: device.id,
          ...(currentSession.ip === null || currentSession.ip === "unknown"
            ? { ip: clientIp !== "unknown" ? clientIp : null }
            : {}),
          ...(currentSession.userAgent === null && deviceData.userAgent
            ? { userAgent: deviceData.userAgent }
            : {}),
          ...(location && !currentSession.locationCity
            ? {
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
              }
            : {}),
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
    const sessionToken = ctx.session.dbSessionId; // Use stable session ID from JWT

    if (!sessionToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No session ID in JWT",
      });
    }

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

    if (currentSession.device && currentSession.device.revoked) {
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
          reason: currentSession.device.revokeReason || "Device access revoked",
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
      const sessionToken = ctx.session.dbSessionId; // Use stable session ID from JWT

      if (!sessionToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No session ID in JWT",
        });
      }

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

  checkSession: protectedProcedure.query(async ({ ctx }) => {
    const sessionToken = ctx.session.dbSessionId; // Use stable session ID from JWT

    if (!sessionToken) {
      return {
        valid: false,
        reason: "NO_SESSION_ID_IN_JWT",
      };
    }

    const session = await ctx.prisma.session.findUnique({
      where: {
        sessionToken,
      },
      include: {
        device: true,
      },
    });

    if (!session) {
      return {
        valid: true,
        reason: "SESSION_NOT_IN_DB_YET",
        sessionId: null,
      };
    }

    if (session.revoked) {
      return {
        valid: false,
        reason: "SESSION_REVOKED",
        revokeReason: session.revokeReason || "Unknown",
      };
    }

    if (session.expires < new Date()) {
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

    if (session.device && session.device.revoked) {
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

    return {
      valid: true,
      sessionId: session.id,
      userId: session.userId,
      deviceId: session.deviceId,
    };
  }),
});
