import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import type { OrgRole } from "@prisma/client";

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

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    let message = shape.message;

    if (error.cause instanceof ZodError) {
      const zodError = error.cause.flatten();
      const firstError = Object.values(zodError.fieldErrors)[0]?.[0];
      if (firstError) {
        message = firstError;
      }
    }

    if (error.code === "UNAUTHORIZED") {
      message = "Sua sessão expirou. Faça login novamente.";
    } else if (error.code === "FORBIDDEN") {
      if (message === "FORBIDDEN" || !message) {
        message = "Você não tem permissão para realizar esta ação.";
      }
    } else if (error.code === "NOT_FOUND") {
      if (message === "NOT_FOUND" || !message) {
        message = "Recurso não encontrado.";
      }
    } else if (error.code === "INTERNAL_SERVER_ERROR") {
      message = "Erro interno do servidor. Tente novamente mais tarde.";
    } else if (error.code === "BAD_REQUEST") {
      if (message === "BAD_REQUEST" || !message) {
        message = "Dados inválidos. Verifique e tente novamente.";
      }
    } else if (error.code === "TIMEOUT") {
      message = "A operação demorou muito. Tente novamente.";
    } else if (error.code === "TOO_MANY_REQUESTS") {
      message = "Muitas requisições. Aguarde um momento.";
    }

    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sua sessão expirou. Faça login novamente para continuar.",
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const withOrg = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sua sessão expirou. Faça login novamente para continuar.",
    });
  }

  return next({
    ctx: {
      ...ctx,
    },
  });
});

const orgProcedureBase = protectedProcedure.use(withOrg);

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

export const orgProcedure = orgProcedureBase;

export function checkRole(userRole: OrgRole, ...allowedRoles: OrgRole[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Esta ação requer uma das seguintes permissões: ${allowedRoles.join(
        ", "
      )}. Entre em contato com um administrador.`,
    });
  }
}

export function requireRole(...allowedRoles: OrgRole[]) {
  return t.middleware(async ({ ctx, next }) => {
    const userRole = (ctx as any).userRole as OrgRole | undefined;

    if (!userRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Contexto de organização necessário.",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Esta ação requer uma das seguintes permissões: ${allowedRoles.join(
          ", "
        )}. Entre em contato com um administrador.`,
      });
    }

    return next();
  });
}

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
