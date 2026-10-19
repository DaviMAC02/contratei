import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const authRouter = createTRPCRouter({
  signupWithOrg: publicProcedure
    .input(
      z
        .object({
          email: z.string().email(),
          name: z.string().min(2),
          orgName: z.string().min(2),
          country: z.string().length(2),
          orgType: z.enum(["PF", "PJ"]).default("PF"),
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
        .refine((data) => (data.orgType === "PJ" ? !!data.cnpj : true), {
          message: "CNPJ é obrigatório para PJ",
          path: ["cnpj"],
        })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, orgName, country } = input;

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            where: { role: "OWNER" },
          },
        },
      });

      if (existingUser) {
        if (existingUser.memberships.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Você já possui uma organização. Cada usuário pode criar apenas uma organização própria.",
          });
        }
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email já está cadastrado.",
        });
      }

      const currency = country === "BR" ? "BRL" : "USD";
      const locale = country === "BR" ? "pt-BR" : "en-US";
      const timezone =
        country === "BR" ? "America/Sao_Paulo" : "America/New_York";

      const baseSlug = orgName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      let slug = baseSlug;
      let counter = 1;
      while (await ctx.prisma.org.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      try {
        const result = await ctx.prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              name,
            },
          });

          const org = await tx.org.create({
            data: {
              name: orgName,
              slug,
              country,
              currency,
              locale,
              timezone,
              orgType: input.orgType,
              cpf: input.orgType === "PF" ? input.cpf : undefined,
              legalName: input.orgType === "PJ" ? input.legalName : undefined,
              tradeName: input.orgType === "PJ" ? input.tradeName : undefined,
              cnpj: input.orgType === "PJ" ? input.cnpj : undefined,
              ie: input.orgType === "PJ" ? input.ie : undefined,
              addressCep: input.address?.cep,
              addressStreet: input.address?.street,
              addressNumber: input.address?.number,
              addressComplement: input.address?.complement,
              addressNeighborhood: input.address?.neighborhood,
              addressCity: input.address?.city,
              addressState: input.address?.state,
            } as any,
          });

          await tx.orgMember.create({
            data: {
              userId: user.id,
              orgId: org.id,
              role: "OWNER",
            },
          });

          await tx.auditLog.create({
            data: {
              orgId: org.id,
              userId: user.id,
              action: "CREATE",
              entityType: "Org",
              entityId: org.id,
              metadata: {
                orgName,
                country,
                orgType: input.orgType,
              },
            },
          });

          return { user, org };
        });

        return {
          success: true,
          userId: result.user.id,
          orgId: result.org.id,
        };
      } catch (error: any) {
        if (error.code === "P2002") {
          const target = error.meta?.target;
          if (target && Array.isArray(target)) {
            if (target.includes("cpf")) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Este CPF já está cadastrado em outra organização.",
              });
            }
            if (target.includes("cnpj")) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Este CNPJ já está cadastrado em outra organização.",
              });
            }
          }
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma organização com estes dados.",
          });
        }
        throw error;
      }
    }),

  checkUserOwnership: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        include: {
          memberships: {
            where: { role: "OWNER" },
          },
        },
      });

      return {
        exists: !!user,
        ownsOrg: user ? user.memberships.length > 0 : false,
      };
    }),

  createSession: protectedProcedure
    .input(
      z
        .object({
          ip: z.string().optional(),
          userAgent: z.string().optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const sessionToken = ctx.session.dbSessionId; // Use stable session ID from JWT

      if (!sessionToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No session ID found in JWT",
        });
      }

      const sessionExpiry = new Date();
      sessionExpiry.setHours(sessionExpiry.getHours() + 24); // 24 hours to match NextAuth maxAge

      const revokedCount = await ctx.prisma.session.updateMany({
        where: {
          userId,
          sessionToken: {
            not: sessionToken,
          },
          revoked: false,
          expires: {
            gt: new Date(),
          },
        },
        data: {
          revoked: true,
          revokeReason: "NEW_LOGIN",
          revokedAt: new Date(),
        },
      });

      if (revokedCount.count > 0) {
        console.log(
          `✅ Revoked ${revokedCount.count} other active session(s) for user ${userId} due to new login`
        );
      }

      const existingSession = await ctx.prisma.session.findUnique({
        where: {
          sessionToken,
        },
      });

      if (
        existingSession &&
        !existingSession.revoked &&
        existingSession.expires > new Date() &&
        existingSession.userId === userId
      ) {
        await ctx.prisma.session.update({
          where: { id: existingSession.id },
          data: {
            expires: sessionExpiry,
          },
        });

        return {
          success: true,
          sessionId: existingSession.id,
          message: "Session already exists and is valid",
          revokedOtherSessions: revokedCount.count,
        };
      }

      const sessionData: {
        sessionToken: string;
        userId: string;
        expires: Date;
        revoked: boolean;
        ip?: string;
        userAgent?: string;
      } = {
        sessionToken,
        userId,
        expires: sessionExpiry,
        revoked: false,
      };

      if (input?.ip && input.ip !== "unknown") {
        sessionData.ip = input.ip;
      }
      if (input?.userAgent) {
        sessionData.userAgent = input.userAgent;
      }

      const session = await ctx.prisma.session.upsert({
        where: {
          sessionToken,
        },
        update: {
          userId,
          expires: sessionExpiry,
          revoked: false,
          revokeReason: null,
          revokedAt: null,
          ...(input?.ip && input.ip !== "unknown" ? { ip: input.ip } : {}),
          ...(input?.userAgent ? { userAgent: input.userAgent } : {}),
        },
        create: sessionData,
      });

      console.log(
        `✅ Created/updated session ${session.id} for user ${userId} after org selection (revoked ${revokedCount.count} other sessions)`
      );

      return {
        success: true,
        sessionId: session.id,
        message: "Session created/updated successfully",
        revokedOtherSessions: revokedCount.count,
      };
    }),
});
