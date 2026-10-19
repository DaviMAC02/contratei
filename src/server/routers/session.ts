import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
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

    return {
      valid: true,
      sessionId: session.id,
      userId: session.userId,
    };
  }),
});
