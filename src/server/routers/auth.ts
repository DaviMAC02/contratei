import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  signupWithOrg: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        orgName: z.string().min(2),
        country: z.string().length(2), // ISO country code
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
          },
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
            entityType: "Organization",
            entityId: org.id,
            metadata: {
              orgName,
              country,
              plan: "FREE",
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
});
