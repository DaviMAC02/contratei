import { z } from "zod";
import {
  createTRPCRouter,
  orgProcedure,
  requireRole,
  createAuditLog,
  checkRole,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { stripe } from "@/lib/stripe";
import {
  PLANS,
  type PlanName,
  type Currency,
  type Interval,
} from "@/lib/stripe";

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

  return {
    org: membership.org,
    membership,
    userRole: membership.role,
  };
}

export const billingRouter = createTRPCRouter({
  // Get current subscription
  getSubscription: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Validate org membership and get org
      const { org } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );

      if (!org.stripeSubscriptionId) {
        return {
          plan: org.plan,
          status: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        };
      }

      const subscription = await ctx.prisma.subscription.findUnique({
        where: { orgId: input.orgId },
      });

      return subscription;
    }),

  // Create checkout session
  createCheckoutSession: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        plan: z.enum(["STARTER", "GROWTH", "PRO", "STUDIO"]),
        interval: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { org, userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER");

      const currency = org.currency as Currency;

      const planConfig = PLANS[input.plan as PlanName];
      const priceId = planConfig.stripePriceId[currency][input.interval];

      if (!priceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Price ID not configured for this plan and currency",
        });
      }

      // Validate downgrade: check if current usage exceeds new plan limits
      const [contractCount, userCount] = await Promise.all([
        ctx.prisma.contract.count({
          where: { orgId: input.orgId },
        }),
        ctx.prisma.orgMember.count({
          where: { orgId: input.orgId },
        }),
      ]);

      if (contractCount > planConfig.maxContracts) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot downgrade to ${
            input.plan
          }. You have ${contractCount} contracts but this plan allows only ${
            planConfig.maxContracts
          }. Please archive or delete ${
            contractCount - planConfig.maxContracts
          } contracts before downgrading.`,
        });
      }

      if (userCount > planConfig.maxUsers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot downgrade to ${
            input.plan
          }. You have ${userCount} users but this plan allows only ${
            planConfig.maxUsers
          }. Please remove ${
            userCount - planConfig.maxUsers
          } users before downgrading.`,
        });
      }

      // Create or get Stripe customer
      let customerId = org.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.session!.user.email,
          metadata: {
            orgId: org.id,
            userId: ctx.session!.user.id,
          },
        });
        customerId = customer.id;

        await ctx.prisma.org.update({
          where: { id: org.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
        metadata: {
          orgId: org.id,
          plan: input.plan,
        },
        subscription_data: {
          metadata: {
            orgId: org.id,
          },
          trial_period_days: org.trialEndsAt ? undefined : 14,
        },
      });

      await createAuditLog({
        orgId: org.id,
        userId: ctx.session!.user.id,
        action: "CREATE",
        entityType: "CheckoutSession",
        entityId: session.id,
        metadata: { plan: input.plan, interval: input.interval },
      });

      return { url: session.url };
    }),

  // Create portal session
  createPortalSession: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { org, userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER");

      if (!org.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No Stripe customer found",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      });

      return { url: session.url };
    }),

  // Get available plans
  getPlans: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Validate org membership and get org
      const { org } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      const currency = org.currency as Currency;

      return Object.entries(PLANS).map(([key, plan]) => ({
        id: key,
        name: plan.name,
        maxContracts: plan.maxContracts,
        maxUsers: plan.maxUsers,
        features: plan.features,
        price: plan.price[currency],
        isCurrentPlan: org.plan === key,
      }));
    }),

  // Cancel subscription
  cancelSubscription: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { org, userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER");

      if (!org.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription",
        });
      }

      await stripe.subscriptions.update(org.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await ctx.prisma.subscription.update({
        where: { orgId: input.orgId },
        data: { cancelAtPeriodEnd: true },
      });

      await createAuditLog({
        orgId: org.id,
        userId: ctx.session!.user.id,
        action: "UPDATE",
        entityType: "Subscription",
        entityId: org.stripeSubscriptionId,
        metadata: { action: "cancel_at_period_end" },
      });

      return { success: true };
    }),

  // Reactivate subscription
  reactivateSubscription: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate org membership and check role
      const { org, userRole } = await validateOrgMembership(
        ctx.prisma,
        ctx.session!.user.id,
        input.orgId
      );
      checkRole(userRole, "OWNER");

      if (!org.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription",
        });
      }

      await stripe.subscriptions.update(org.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      await ctx.prisma.subscription.update({
        where: { orgId: input.orgId },
        data: { cancelAtPeriodEnd: false },
      });

      await createAuditLog({
        orgId: org.id,
        userId: ctx.session!.user.id,
        action: "UPDATE",
        entityType: "Subscription",
        entityId: org.stripeSubscriptionId,
        metadata: { action: "reactivate" },
      });

      return { success: true };
    }),
});
