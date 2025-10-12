import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  orgProcedure,
  requireRole,
  createAuditLog,
  checkRole,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { OrgRole, OrgPlan } from "@prisma/client";
import { nanoid } from "nanoid";
import { resend, emailTemplates } from "@/lib/email";
import { addDays } from "date-fns";

// Helper to validate org membership
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
      message: "You do not have access to this organization",
    });
  }

  return { org: membership.org, membership, userRole: membership.role };
}

// Country to currency/locale mapping
const countryConfig: Record<
  string,
  { currency: string; locale: string; timezone: string }
> = {
  BR: { currency: "BRL", locale: "pt-BR", timezone: "America/Sao_Paulo" },
  US: { currency: "USD", locale: "en-US", timezone: "America/New_York" },
  // Add more countries as needed
};

function getCountryConfig(countryCode: string) {
  return (
    countryConfig[countryCode] || {
      currency: "USD",
      locale: "en-US",
      timezone: "UTC",
    }
  );
}

export const orgRouter = createTRPCRouter({
  // List user's organizations
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.orgMember.findMany({
      where: { userId: ctx.session!.user.id },
      include: {
        org: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return memberships.map((m) => ({
      ...m.org,
      role: m.role,
    }));
  }),

  // Get single organization
  get: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get org with member count
      const org = await ctx.prisma.org.findUnique({
        where: { id: input.orgId },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Validate user has access
      const membership = await ctx.prisma.orgMember.findUnique({
        where: {
          orgId_userId: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this organization",
        });
      }

      return org;
    }),

  // Create organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        country: z.string().length(2), // ISO country code
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already owns an organization
      const existingOwnership = await ctx.prisma.orgMember.findFirst({
        where: {
          userId: ctx.session!.user.id,
          role: "OWNER",
        },
      });

      if (existingOwnership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Você já possui uma organização. Cada usuário pode criar apenas uma organização própria para faturamento.",
        });
      }

      const config = getCountryConfig(input.country);
      const slug = `${input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${nanoid(6)}`;

      const org = await ctx.prisma.org.create({
        data: {
          name: input.name,
          slug,
          country: input.country,
          timezone: input.timezone || config.timezone,
          locale: config.locale,
          currency: config.currency,
          plan: "FREE",
          maxContracts: 3,
          maxUsers: 1,
          trialEndsAt: addDays(new Date(), 14),
        },
      });

      // Add creator as owner
      await ctx.prisma.orgMember.create({
        data: {
          orgId: org.id,
          userId: ctx.session!.user.id,
          role: "OWNER",
        },
      });

      await createAuditLog({
        orgId: org.id,
        userId: ctx.session!.user.id,
        action: "CREATE",
        entityType: "Org",
        entityId: org.id,
      });

      return org;
    }),

  // Update organization
  update: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(1).max(100).optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN");

      const { orgId, ...updateData } = input;

      const org = await ctx.prisma.org.update({
        where: { id: orgId },
        data: updateData,
      });

      await createAuditLog({
        orgId,
        userId: ctx.session!.user.id,
        action: "UPDATE",
        entityType: "Org",
        entityId: orgId,
        metadata: updateData,
      });

      return org;
    }),

  // List members
  listMembers: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Validate org membership
      await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      return ctx.prisma.orgMember.findMany({
        where: { orgId: input.orgId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // Invite user
  inviteUser: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        email: z.string().email(),
        role: z.nativeEnum(OrgRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership, check role, and get org for plan limits
      const { org, userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN");

      // Check user limit
      const memberCount = await ctx.prisma.orgMember.count({
        where: { orgId: input.orgId },
      });

      if (memberCount >= org.maxUsers) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You have reached the maximum number of users (${org.maxUsers}) for your plan.`,
        });
      }

      // Warn if approaching limit (80%)
      const limitThreshold = org.maxUsers * 0.8;
      if (memberCount >= limitThreshold && memberCount < org.maxUsers) {
        // Create notification for approaching limit
        await ctx.prisma.notification.create({
          data: {
            orgId: input.orgId,
            userId: ctx.session!.user.id,
            eventType: "PLAN_LIMIT_REACHED",
            channel: "IN_APP",
            status: "PENDING",
            title: "Limite de usuários próximo",
            message: `Você está usando ${memberCount} de ${
              org.maxUsers
            } usuários (${Math.round(
              (memberCount / org.maxUsers) * 100
            )}%). Considere fazer upgrade do seu plano.`,
            metadata: {
              type: "users",
              currentCount: memberCount,
              maxCount: org.maxUsers,
              percentage: Math.round((memberCount / org.maxUsers) * 100),
            },
          },
        });
      }

      // Check if user already exists
      const existingMember = await ctx.prisma.orgMember.findFirst({
        where: {
          orgId: input.orgId,
          user: { email: input.email },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this organization",
        });
      }

      // Check for existing invitation
      const existingInvite = await ctx.prisma.invitation.findUnique({
        where: {
          orgId_email: {
            orgId: input.orgId,
            email: input.email,
          },
        },
      });

      if (existingInvite && !existingInvite.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invitation has already been sent to this email",
        });
      }

      const token = nanoid(32);
      const invitation = await ctx.prisma.invitation.create({
        data: {
          orgId: input.orgId,
          email: input.email,
          role: input.role,
          token,
          inviterId: ctx.session!.user.id,
          expiresAt: addDays(new Date(), 7),
        },
      });

      // Send invitation email
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
      const locale = org.locale as "pt-BR" | "en-US";
      const template = emailTemplates.invitation[locale];

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: input.email,
        subject: template.subject,
        html: template.getHtml(
          ctx.session!.user.name || "Someone",
          org.name,
          inviteUrl
        ),
      });

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "INVITE",
        entityType: "Invitation",
        entityId: invitation.id,
        metadata: { email: input.email, role: input.role },
      });

      return invitation;
    }),

  // Accept invitation
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { token: input.token },
        include: { org: true },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has already been accepted",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired",
        });
      }

      if (invitation.email !== ctx.session!.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        });
      }

      // Create membership
      await ctx.prisma.$transaction([
        ctx.prisma.orgMember.create({
          data: {
            orgId: invitation.orgId,
            userId: ctx.session!.user.id,
            role: invitation.role,
          },
        }),
        ctx.prisma.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      await createAuditLog({
        orgId: invitation.orgId,
        userId: ctx.session!.user.id,
        action: "ACCEPT_INVITE",
        entityType: "OrgMember",
        entityId: ctx.session!.user.id,
      });

      return invitation.org;
    }),

  // Update member role
  updateMemberRole: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        userId: z.string(),
        role: z.nativeEnum(OrgRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN");

      const member = await ctx.prisma.orgMember.update({
        where: {
          orgId_userId: {
            orgId: input.orgId,
            userId: input.userId,
          },
        },
        data: { role: input.role },
      });

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "CHANGE_ROLE",
        entityType: "OrgMember",
        entityId: input.userId,
        metadata: { newRole: input.role },
      });

      return member;
    }),

  // Remove member
  removeMember: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN");
      checkRole(userRole, "OWNER", "ADMIN");

      // Can't remove yourself
      if (input.userId === ctx.session!.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself",
        });
      }

      await ctx.prisma.orgMember.delete({
        where: {
          orgId_userId: {
            orgId: input.orgId,
            userId: input.userId,
          },
        },
      });

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "DELETE",
        entityType: "OrgMember",
        entityId: input.userId,
      });

      return { success: true };
    }),
});
