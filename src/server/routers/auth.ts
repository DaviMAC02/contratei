import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

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
