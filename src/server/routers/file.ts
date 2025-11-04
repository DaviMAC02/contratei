import { z } from "zod";
import {
  createTRPCRouter,
  orgProcedure,
  requireRole,
  createAuditLog,
  checkRole,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { hasPlanFeature, type PlanName } from "@/lib/stripe";

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

export const fileRouter = createTRPCRouter({
  uploadFile: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        contractId: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.enum(["MAIN", "ATTACHMENT"]),
        mimeType: z.string(),
        fileContent: z.string(), // Base64 encoded file content
        checksum: z.string(),
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

      // Check if plan supports file upload
      if (!hasPlanFeature(org.plan as PlanName, "fileUpload")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Seu plano não suporta upload de arquivos. Faça upgrade para desbloquear esta funcionalidade.",
        });
      }

      // Verify contract belongs to org
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: input.contractId, orgId: input.orgId },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contrato não encontrado ou você não tem acesso a ele.",
        });
      }

      const file = await ctx.prisma.contractFile.create({
        data: {
          contractId: input.contractId,
          orgId: input.orgId,
          fileName: input.fileName,
          fileType: input.fileType,
          mimeType: input.mimeType,
          fileContent: input.fileContent,
          checksum: input.checksum,
          sizeBytes: input.fileSize,
          uploadedBy: ctx.session!.user.id,
        } as any,
      });

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "CREATE",
        entityType: "ContractFile",
        entityId: file.id,
        metadata: { fileName: input.fileName, contractId: input.contractId },
      });

      return file;
    }),

  listFiles: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        contractId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const files = await ctx.prisma.contractFile.findMany({
        where: {
          contractId: input.contractId,
          orgId: input.orgId,
        },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          sizeBytes: true,
          uploadedAt: true,
          checksum: true,
        },
        orderBy: { uploadedAt: "desc" },
      });

      return files;
    }),

  getFileContent: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const file = (await ctx.prisma.contractFile.findUnique({
        where: { id: input.fileId },
      })) as any;

      if (!file || file.orgId !== input.orgId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "DOWNLOAD",
        entityType: "ContractFile",
        entityId: file.id,
        metadata: { fileName: file.fileName },
      });

      return {
        fileName: file.fileName,
        mimeType: file.mimeType || "application/octet-stream",
        fileContent: file.fileContent,
        sizeBytes: file.sizeBytes,
      };
    }),

  deleteFile: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        fileId: z.string(),
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

      const file = await ctx.prisma.contractFile.findUnique({
        where: { id: input.fileId },
      });

      if (!file || file.orgId !== input.orgId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      await ctx.prisma.contractFile.delete({
        where: { id: input.fileId },
      });

      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "DELETE",
        entityType: "ContractFile",
        entityId: file.id,
        metadata: { fileName: file.fileName },
      });

      return { success: true };
    }),
});
