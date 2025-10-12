import { z } from "zod";
import {
  createTRPCRouter,
  orgProcedure,
  requireRole,
  createAuditLog,
  checkRole,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "@/lib/supabase";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { hasPlanFeature, type PlanName } from "@/lib/stripe";

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

  return {
    org: membership.org,
    membership,
    userRole: membership.role,
  };
}

export const fileRouter = createTRPCRouter({
  // Get upload URL (presigned)
  getUploadUrl: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        contractId: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.enum(["MAIN", "ATTACHMENT"]),
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
            "Your plan does not support file uploads. Please upgrade to upload files.",
        });
      }

      // Verify contract belongs to org
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: input.contractId, orgId: input.orgId },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      // Generate unique file path
      const fileId = nanoid();
      const extension = input.fileName.split(".").pop();
      const storagePath = `${input.orgId}/${input.contractId}/${fileId}.${extension}`;

      // Create presigned URL for upload
      const { data, error } = await supabaseAdmin.storage
        .from("contracts")
        .createSignedUploadUrl(storagePath);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create upload URL",
        });
      }

      return {
        uploadUrl: data.signedUrl,
        storagePath,
        token: data.token,
      };
    }),

  // Confirm upload and create file record
  confirmUpload: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        contractId: z.string(),
        fileName: z.string(),
        storagePath: z.string(),
        fileSize: z.number(),
        fileType: z.enum(["MAIN", "ATTACHMENT"]),
        checksum: z.string(),
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

      const file = await ctx.prisma.contractFile.create({
        data: {
          contractId: input.contractId,
          orgId: input.orgId,
          fileName: input.fileName,
          fileType: input.fileType,
          storagePath: input.storagePath,
          checksum: input.checksum,
          sizeBytes: input.fileSize,
          uploadedBy: ctx.session!.user.id,
        },
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

  // List files for contract
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
        orderBy: { uploadedAt: "desc" },
      });

      return files;
    }),

  // Get download URL (presigned)
  getDownloadUrl: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        fileId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.prisma.contractFile.findUnique({
        where: { id: input.fileId },
      });

      if (!file || file.orgId !== input.orgId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      // Create presigned URL for download
      const { data, error } = await supabaseAdmin.storage
        .from("contracts")
        .createSignedUrl(file.storagePath, 3600); // 1 hour expiry

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create download URL",
        });
      }

      // Log download
      await createAuditLog({
        orgId: input.orgId,
        userId: ctx.session!.user.id,
        action: "DOWNLOAD",
        entityType: "ContractFile",
        entityId: file.id,
        metadata: { fileName: file.fileName },
      });

      return {
        url: data.signedUrl,
        fileName: file.fileName,
      };
    }),

  // Delete file
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

      // Delete from Supabase Storage
      const { error } = await supabaseAdmin.storage
        .from("contracts")
        .remove([file.storagePath]);

      if (error) {
        console.error("Failed to delete file from storage:", error);
      }

      // Delete from database
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
