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
      message: "Você não tem acesso a esta organização ou ela não existe.",
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
  // List user's organizations (excluding soft-deleted)
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.orgMember.findMany({
      where: {
        userId: ctx.session!.user.id,
        org: {
          deletedAt: null, // Only show non-deleted organizations
        },
      },
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
        orgType: z.enum(["PF", "PJ"]).default("PF"),
        // Identification
        cpf: z.string().optional(),
        legalName: z.string().optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        ie: z.string().optional(),
        // Address
        address: z
          .object({
            cep: z.string().optional(),
            street: z.string().optional(),
            number: z.string().optional(),
            complement: z.string().optional(),
            neighborhood: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
          })
          .optional(),
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
        // Cast to any to avoid type mismatch until Prisma types are regenerated
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
          orgType: input.orgType,
          // Identification
          cpf: input.orgType === "PF" ? input.cpf : undefined,
          legalName: input.orgType === "PJ" ? input.legalName : undefined,
          tradeName: input.orgType === "PJ" ? input.tradeName : undefined,
          cnpj: input.orgType === "PJ" ? input.cnpj : undefined,
          ie: input.orgType === "PJ" ? input.ie : undefined,
          // Address
          addressCep: input.address?.cep,
          addressStreet: input.address?.street,
          addressNumber: input.address?.number,
          addressComplement: input.address?.complement,
          addressNeighborhood: input.address?.neighborhood,
          addressCity: input.address?.city,
          addressState: input.address?.state,
        } as any,
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
        orgType: z.enum(["PF", "PJ"]).optional(),
        cpf: z.string().optional(),
        legalName: z.string().optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        ie: z.string().optional(),
        address: z
          .object({
            cep: z.string().optional(),
            street: z.string().optional(),
            number: z.string().optional(),
            complement: z.string().optional(),
            neighborhood: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
          })
          .optional(),
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

      const { orgId, address, ...rest } = input as any;
      const updateData: any = { ...rest };
      if (address) {
        updateData.addressCep = address.cep;
        updateData.addressStreet = address.street;
        updateData.addressNumber = address.number;
        updateData.addressComplement = address.complement;
        updateData.addressNeighborhood = address.neighborhood;
        updateData.addressCity = address.city;
        updateData.addressState = address.state;
      }

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
    .input(
      z.object({
        orgId: z.string(),
        search: z.string().optional(),
        role: z.nativeEnum(OrgRole).optional(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
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
      };

      // Add search filter
      if (input.search) {
        where.user = {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ],
        };
      }

      // Add role filter
      if (input.role) {
        where.role = input.role;
      }

      const members = await ctx.prisma.orgMember.findMany({
        where,
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
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (members.length > input.limit) {
        const nextItem = members.pop();
        nextCursor = nextItem!.id;
      }

      return {
        members,
        nextCursor,
      };
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

      // Check if user with this email exists in the system
      const userExists = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, name: true },
      });

      if (!userExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Não foi encontrada uma conta com este email. O usuário deve criar uma conta primeiro.",
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
          message: "Este usuário já é membro desta organização",
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
          message:
            "Já foi enviado um convite para este email. Verifique se o usuário recebeu o convite.",
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

  // Soft delete organization (administrative purposes only)
  // This route should only be called by admins/owners for administrative purposes
  softDelete: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role - only OWNER can delete
      const { userRole, org } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER");

      // Check if already deleted
      if (org.deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization is already deleted",
        });
      }

      // Soft delete the organization
      const deletedOrg = await ctx.prisma.org.update({
        where: { id: input.orgId },
        data: {
          deletedAt: new Date(),
        },
      });

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "DELETE",
        entityType: "Org",
        entityId: input.orgId,
        metadata: { deletedAt: deletedOrg.deletedAt },
      });

      return { success: true, deletedAt: deletedOrg.deletedAt };
    }),
});
