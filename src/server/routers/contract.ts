import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  orgProcedure,
  requireRole,
  checkRole,
  createAuditLog,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { ContractStatus, AdjustmentType, OrgRole } from "@prisma/client";
import { addDays, differenceInCalendarDays } from "date-fns";

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

// Helper to calculate next renewal date from start/end (no periodicity)
function calculateNextRenewalDateFromRange(
  startDate?: Date | null,
  endDate?: Date | null
): Date | null {
  if (endDate) return endDate;
  if (!startDate) return null;
  // Default to 1 year (365 days)
  return addDays(startDate, 365);
}

// Helper to determine contract status
function determineContractStatus(
  endDate: Date | null,
  nextRenewalDate: Date | null,
  autoRenew: boolean
): ContractStatus {
  if (!endDate && !nextRenewalDate) return "ACTIVE";

  const now = new Date();
  const targetDate = nextRenewalDate || endDate;

  if (!targetDate) return "ACTIVE";

  const daysUntilExpiry = Math.ceil(
    (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return "EXPIRED";
  if (daysUntilExpiry <= 90) return "DUE_SOON";
  return "ACTIVE";
}

export const contractRouter = createTRPCRouter({
  // List contracts for an organization
  list: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        status: z.nativeEnum(ContractStatus).optional(),
        ownerId: z.string().optional(),
        search: z.string().optional(),
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

      if (input.status) {
        where.status = input.status;
      }

      if (input.ownerId) {
        where.ownerUserId = input.ownerId;
      }

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { counterpartyName: { contains: input.search, mode: "insensitive" } },
          { tags: { hasSome: [input.search] } },
        ];
      }

      const contracts = await ctx.prisma.contract.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              files: true,
              adjustments: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (contracts.length > input.limit) {
        const nextItem = contracts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        contracts,
        nextCursor,
      };
    }),

  // Get single contract
  get: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Validate org membership
      await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      const contract = await ctx.prisma.contract.findUnique({
        where: {
          id: input.id,
          orgId: input.orgId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          files: true,
          adjustments: {
            orderBy: { adjustmentDate: "desc" },
          },
          renewalHistory: {
            orderBy: { renewalDate: "desc" },
          },
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contrato não encontrado ou você não tem acesso a ele.",
        });
      }

      // Create audit log for viewing
      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "VIEW",
        entityType: "Contract",
        entityId: contract.id,
      });

      return contract;
    }),

  // Create contract
  create: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        contractType: z.enum(["INBOUND", "OUTBOUND"]).default("OUTBOUND"),
        counterpartyName: z.string().min(1),
        counterpartyContact: z.string().optional(),
        ownerUserId: z.string(),
        tags: z.array(z.string()).default([]),
        costCenter: z.string().optional(),
        notes: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        // periodicityDays computed if not provided
        periodicityDays: z.number().int().positive().optional(),
        autoRenew: z.boolean().default(true),
        valueAmount: z.number().positive(),
        adjustmentType: z.nativeEnum(AdjustmentType).default("NONE"),
        adjustmentValue: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { org, userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN", "MANAGER");

      const nextRenewalDate = calculateNextRenewalDateFromRange(
        input.startDate,
        input.endDate || null
      );

      const computedPeriodicityDays = input.periodicityDays
        ? input.periodicityDays
        : input.endDate
        ? Math.max(
            1,
            differenceInCalendarDays(input.endDate, input.startDate)
          )
        : 365;

      const status = determineContractStatus(
        input.endDate || null,
        nextRenewalDate,
        input.autoRenew
      );

      const contract = await ctx.prisma.contract.create({
        data: {
          orgId: input.orgId,
          title: input.title,
          description: input.description,
          contractType: input.contractType,
          counterpartyName: input.counterpartyName,
          counterpartyContact: input.counterpartyContact,
          ownerUserId: input.ownerUserId,
          tags: input.tags,
          costCenter: input.costCenter,
          notes: input.notes,
          startDate: input.startDate,
          endDate: input.endDate,
          nextRenewalDate,
          periodicityDays: computedPeriodicityDays,
          autoRenew: input.autoRenew,
          valueAmount: input.valueAmount,
          currency: org.currency,
          adjustmentType: input.adjustmentType,
          adjustmentValue: input.adjustmentValue,
          status,
        },
      });

      // Create audit log
      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "CREATE",
        entityType: "Contract",
        entityId: contract.id,
        metadata: { contract },
      });

      return contract;
    }),

  // Update contract
  update: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        contractType: z.enum(["INBOUND", "OUTBOUND"]).optional(),
        counterpartyName: z.string().min(1).optional(),
        counterpartyContact: z.string().optional(),
        ownerUserId: z.string().optional(),
        tags: z.array(z.string()).optional(),
        costCenter: z.string().optional(),
        notes: z.string().optional(),
        endDate: z.date().optional(),
        autoRenew: z.boolean().optional(),
        adjustmentType: z.nativeEnum(AdjustmentType).optional(),
        adjustmentValue: z.number().optional(),
        nextRenewalDate: z.date().optional(),
        periodicityDays: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN", "MANAGER");

      const { id, orgId, ...updateData } = input;

      const existing = await ctx.prisma.contract.findUnique({
        where: { id, orgId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contrato não encontrado ou você não tem acesso a ele.",
        });
      }

      // If nextRenewalDate not explicitly provided, recompute when endDate/periodicityDays change
      let dataToUpdate: any = { ...updateData };
      const endDateChanged = Object.prototype.hasOwnProperty.call(
        updateData,
        "endDate"
      );
      const periodicityChanged = Object.prototype.hasOwnProperty.call(
        updateData,
        "periodicityDays"
      );
      const nextRenewalProvided = Object.prototype.hasOwnProperty.call(
        updateData,
        "nextRenewalDate"
      );

      if (!nextRenewalProvided && (endDateChanged || periodicityChanged)) {
        const effectiveEndDate = (updateData.endDate as Date | undefined) ?? existing.endDate;
        const effectivePeriodicity =
          (updateData.periodicityDays as number | undefined) ?? existing.periodicityDays;

        if (effectiveEndDate) {
          dataToUpdate.nextRenewalDate = effectiveEndDate;
        } else if (effectivePeriodicity) {
          dataToUpdate.nextRenewalDate = addDays(existing.startDate, effectivePeriodicity);
        }
      }

      const contract = await ctx.prisma.contract.update({
        where: { id },
        data: dataToUpdate,
      });

      await createAuditLog({
        orgId,
        userId: ctx.session!.user.id,
        action: "UPDATE",
        entityType: "Contract",
        entityId: id,
        metadata: { before: existing, after: contract },
      });

      return contract;
    }),

  // Renew contract
  renew: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN", "MANAGER");

      const contract = await ctx.prisma.contract.findUnique({
        where: { id: input.id, orgId: input.orgId },
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const previousEndDate = contract.nextRenewalDate || contract.endDate!;
      // Determine duration from original range; fallback to 365 days
      const durationDays = contract.endDate && contract.startDate
        ? Math.max(
            1,
            differenceInCalendarDays(contract.endDate, contract.startDate)
          )
        : 365;
      const newEndDate = addDays(previousEndDate, durationDays);

      const [updated] = await ctx.prisma.$transaction([
        ctx.prisma.contract.update({
          where: { id: input.id },
          data: {
            endDate: newEndDate,
            nextRenewalDate: newEndDate,
            status: "ACTIVE",
          },
        }),
        ctx.prisma.renewalHistory.create({
          data: {
            contractId: input.id,
            orgId: input.orgId,
            renewalDate: new Date(),
            previousEndDate,
            newEndDate,
            renewedBy: ctx.session!.user.id,
          },
        }),
      ]);

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "RENEW",
        entityType: "Contract",
        entityId: input.id,
        metadata: { previousEndDate, newEndDate },
      });

      return updated;
    }),

  // Apply adjustment
  applyAdjustment: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        id: z.string(),
        percentage: z.number().min(0).max(100),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER", "ADMIN", "MANAGER");

      const contract = await ctx.prisma.contract.findUnique({
        where: { id: input.id, orgId: input.orgId },
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const oldValue = Number(contract.valueAmount);
      const newValue = oldValue * (1 + input.percentage / 100);

      const [updated] = await ctx.prisma.$transaction([
        ctx.prisma.contract.update({
          where: { id: input.id },
          data: {
            valueAmount: newValue,
          },
        }),
        ctx.prisma.contractAdjustment.create({
          data: {
            contractId: input.id,
            orgId: input.orgId,
            adjustmentDate: new Date(),
            oldValue,
            newValue,
            percentage: input.percentage,
            reason: input.reason,
            appliedBy: ctx.session!.user.id,
          },
        }),
      ]);

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "ADJUST",
        entityType: "Contract",
        entityId: input.id,
        metadata: { oldValue, newValue, percentage: input.percentage },
      });

      return updated;
    }),

  // Delete contract
  delete: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        id: z.string(),
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

      await ctx.prisma.contract.delete({
        where: { id: input.id, orgId: input.orgId },
      });

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "DELETE",
        entityType: "Contract",
        entityId: input.id,
      });

      return { success: true };
    }),

  // Get dashboard stats
  getDashboardStats: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Validate org membership
      await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      const now = new Date();
      const in30Days = addDays(now, 30);
      const in60Days = addDays(now, 60);
      const in90Days = addDays(now, 90);

      const [
        total,
        active,
        dueSoon,
        expired,
        expiring30,
        expiring60,
        expiring90,
        totalValue,
      ] = await Promise.all([
        ctx.prisma.contract.count({
          where: { orgId: input.orgId },
        }),
        ctx.prisma.contract.count({
          where: { orgId: input.orgId, status: "ACTIVE" },
        }),
        ctx.prisma.contract.count({
          where: { orgId: input.orgId, status: "DUE_SOON" },
        }),
        ctx.prisma.contract.count({
          where: { orgId: input.orgId, status: "EXPIRED" },
        }),
        ctx.prisma.contract.count({
          where: {
            orgId: input.orgId,
            nextRenewalDate: { lte: in30Days, gte: now },
          },
        }),
        ctx.prisma.contract.count({
          where: {
            orgId: input.orgId,
            nextRenewalDate: { lte: in60Days, gte: now },
          },
        }),
        ctx.prisma.contract.count({
          where: {
            orgId: input.orgId,
            nextRenewalDate: { lte: in90Days, gte: now },
          },
        }),
        ctx.prisma.contract.aggregate({
          where: { orgId: input.orgId, status: "ACTIVE" },
          _sum: { valueAmount: true },
        }),
      ]);

      return {
        total,
        active,
        dueSoon,
        expired,
        expiring30,
        expiring60,
        expiring90,
        totalValue: Number(totalValue._sum.valueAmount || 0),
      };
    }),
});
