import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  orgProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";

async function validateOrgMembership(
  prisma: any,
  userId: string,
  orgId: string
) {
  const membership = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
    include: {
      org: true,
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem acesso a esta organização ou ela não existe.",
    });
  }

  return {
    org: membership.org,
    membership,
    userRole: membership.role,
  };
}

export const notificationRouter = createTRPCRouter({
  // List notifications for current user in selected org
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        unreadOnly: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      // Validate org membership
      await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      const where: any = {
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        channel: "IN_APP",
      };

      if (input.unreadOnly) {
        where.readAt = null;
      }

      const notifications = await ctx.prisma.notification.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          message: true,
          eventType: true,
          status: true,
          readAt: true,
          createdAt: true,
          metadata: true,
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  // Get unread count
  getUnreadCount: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Validate org membership
      await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      const count = await ctx.prisma.notification.count({
        where: {
          orgId: input.orgId,
          userId: ctx.session!.user.id,
          channel: "IN_APP",
          readAt: null,
        },
      });

      return { count };
    }),

  // Mark notification as read
  markAsRead: orgProcedure
    .input(z.object({ orgId: z.string(), notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate org membership
      await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      // Verify notification belongs to user
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notificação não encontrada.",
        });
      }

      if (
        notification.userId !== ctx.session!.user.id ||
        notification.orgId !== input.orgId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta notificação.",
        });
      }

      await ctx.prisma.notification.update({
        where: { id: input.notificationId },
        data: {
          readAt: new Date(),
          status: "READ",
        },
      });

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate org membership
      await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      await ctx.prisma.notification.updateMany({
        where: {
          orgId: input.orgId,
          userId: ctx.session!.user.id,
          channel: "IN_APP",
          readAt: null,
        },
        data: {
          readAt: new Date(),
          status: "READ",
        },
      });

      return { success: true };
    }),
});

