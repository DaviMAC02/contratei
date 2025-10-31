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
          country: z.string().length(2), // ISO country code
          orgType: z.enum(["PF", "PJ"]).default("PF"),
          // Identification (BR focus)
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
        .refine((data) => (data.orgType === "PJ" ? !!data.cnpj : true), {
          message: "CNPJ é obrigatório para PJ",
          path: ["cnpj"],
        })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, orgName, country } = input;

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            where: { role: "OWNER" },
          },
        },
      });

      if (existingUser) {
        // Check if user already owns an organization
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

      // Determine currency and locale based on country
      const currency = country === "BR" ? "BRL" : "USD";
      const locale = country === "BR" ? "pt-BR" : "en-US";
      const timezone =
        country === "BR" ? "America/Sao_Paulo" : "America/New_York";

      // Generate slug from org name
      const baseSlug = orgName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure slug is unique
      let slug = baseSlug;
      let counter = 1;
      while (await ctx.prisma.org.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create user and organization in a transaction
      try {
        const result = await ctx.prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.user.create({
            data: {
              email,
              name,
            },
          });

          // Create organization
          const org = await tx.org.create({
            data: {
              name: orgName,
              slug,
              country,
              currency,
              locale,
              timezone,
              plan: "FREE",
              maxContracts: 3,
              maxUsers: 1,
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

          // Create membership with OWNER role
          await tx.orgMember.create({
            data: {
              userId: user.id,
              orgId: org.id,
              role: "OWNER",
            },
          });

          // Create audit log
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
                plan: "FREE",
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
        // Handle Prisma unique constraint violations
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
        // Re-throw other errors
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
          location: z
            .object({
              city: z.string().optional(),
              region: z.string().optional(),
              country: z.string().optional(),
              countryCode: z.string().optional(),
              latitude: z.number().optional(),
              longitude: z.number().optional(),
              source: z.string().optional(),
            })
            .optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("authjs.session-token")?.value;

      if (!sessionToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No session token found",
        });
      }

      const sessionExpiry = new Date();
      sessionExpiry.setDate(sessionExpiry.getDate() + 30);

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
        location?: string;
        locationCity?: string;
        locationRegion?: string;
        locationCountry?: string;
        locationCountryCode?: string;
        latitude?: number;
        longitude?: number;
        locationSource?: string;
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

      if (input?.location) {
        const loc = input.location;
        if (loc.city) {
          sessionData.locationCity = loc.city;
          sessionData.location = `${loc.city}${loc.region ? `, ${loc.region}` : ""}${loc.country ? `, ${loc.country}` : ""}`.trim();
        }
        if (loc.region) {
          sessionData.locationRegion = loc.region;
        }
        if (loc.country) {
          sessionData.locationCountry = loc.country;
        }
        if (loc.countryCode) {
          sessionData.locationCountryCode = loc.countryCode;
        }
        if (loc.latitude !== undefined) {
          sessionData.latitude = loc.latitude;
        }
        if (loc.longitude !== undefined) {
          sessionData.longitude = loc.longitude;
        }
        if (loc.source) {
          sessionData.locationSource = loc.source;
        }
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
          ...(input?.location ? {
            location: sessionData.location || null,
            locationCity: sessionData.locationCity || null,
            locationRegion: sessionData.locationRegion || null,
            locationCountry: sessionData.locationCountry || null,
            locationCountryCode: sessionData.locationCountryCode || null,
            latitude: sessionData.latitude || null,
            longitude: sessionData.longitude || null,
            locationSource: sessionData.locationSource || null,
          } : {}),
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
