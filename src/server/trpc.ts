import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import type { OrgRole } from "@prisma/client";

// Context type
export async function createTRPCContext(opts?: FetchCreateContextFnOptions) {
  const session = await auth();
  const requestId = nanoid();

  return {
    session,
    prisma,
    requestId,
    headers: opts?.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware to ensure user is authenticated
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Middleware to inject current org context
// Note: This runs BEFORE input parsing, so we skip validation here
// and let the procedure's input schema handle orgId validation
export const withOrg = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Pass through - orgId validation will happen in the procedure
  return next({
    ctx: {
      ...ctx,
    },
  });
});

// Org-scoped procedure base (just ensures authentication)
const orgProcedureBase = protectedProcedure.use(withOrg);

// Helper to validate org membership (use this in procedures)
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

// Org-scoped procedure
export const orgProcedure = orgProcedureBase;

// Role-based access control helper (call after validateOrgMembership)
export function checkRole(userRole: OrgRole, ...allowedRoles: OrgRole[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires one of the following roles: ${allowedRoles.join(
        ", "
      )}`,
    });
  }
}

// Legacy middleware for backwards compatibility (deprecated)
export function requireRole(...allowedRoles: OrgRole[]) {
  return t.middleware(async ({ ctx, next }) => {
    const userRole = (ctx as any).userRole as OrgRole | undefined;

    if (!userRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Organization context required",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires one of the following roles: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    return next();
  });
}

// Audit log helper
export async function createAuditLog(params: {
  orgId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  ip?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      orgId: params.orgId,
      userId: params.userId,
      action: params.action as any,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      ip: params.ip,
      userAgent: params.userAgent,
    },
  });
}
