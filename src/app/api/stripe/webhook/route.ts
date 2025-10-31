import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  console.log("Stripe webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.orgId;

  if (!orgId) {
    console.error("No orgId in checkout session metadata");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await handleSubscriptionUpdated(subscription);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.orgId;

  if (!orgId) {
    console.error("No orgId in subscription metadata");
    return;
  }

  const org = await prisma.org.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    console.error(`Organization ${orgId} not found`);
    return;
  }

  // Determine plan from price
  const priceId = subscription.items.data[0]?.price.id;
  let plan: keyof typeof PLANS = "FREE";
  let maxContracts = 3;
  let maxUsers = 1;

  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    const stripePriceIds = Object.values(planConfig.stripePriceId)
      .flatMap((currency) => Object.values(currency))
      .filter(Boolean);

    if (stripePriceIds.includes(priceId)) {
      plan = planKey as keyof typeof PLANS;
      maxContracts = planConfig.maxContracts;
      maxUsers = planConfig.maxUsers;
      break;
    }
  }

  // Check if this is a downgrade and if it exceeds limits
  const oldPlan = org.plan;
  const isDowngrade = isPlanDowngrade(oldPlan, plan);

  if (isDowngrade) {
    await handleDowngrade(orgId, oldPlan, plan, maxContracts, maxUsers);
  }

  const status = mapStripeStatus(subscription.status);

  // Update or create subscription
  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId!,
      stripeCustomerId: subscription.customer as string,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      status,
      stripePriceId: priceId!,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Update org
  await prisma.org.update({
    where: { id: orgId },
    data: {
      plan: plan as any, // Type assertion needed until Prisma types are regenerated
      maxContracts,
      maxUsers,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`Updated subscription for org ${orgId} to plan ${plan}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.orgId;

  if (!orgId) {
    console.error("No orgId in subscription metadata");
    return;
  }

  const org = await prisma.org.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    console.error(`Organization ${orgId} not found`);
    return;
  }

  // Check if this is a downgrade to FREE
  if (org.plan !== "FREE") {
    await handleDowngrade(orgId, org.plan, "FREE", 3, 1);
  }

  // Downgrade to FREE plan
  await prisma.org.update({
    where: { id: orgId },
    data: {
      plan: "FREE",
      maxContracts: 3,
      maxUsers: 1,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  await prisma.subscription.delete({
    where: { orgId },
  });

  console.log(`Subscription deleted for org ${orgId}, downgraded to FREE`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(subscription);

  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const orgId = invoice.subscription_details?.metadata?.orgId;

  if (!orgId) return;

  // You could send an email notification here
  console.log(`Payment failed for org ${orgId}, invoice ${invoice.id}`);
}

// Helper to check if plan change is a downgrade
function isPlanDowngrade(oldPlan: string, newPlan: string): boolean {
  const planHierarchy: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    ENTERPRISE: 2,
  };

  const oldLevel = planHierarchy[oldPlan] ?? 0;
  const newLevel = planHierarchy[newPlan] ?? 0;

  return newLevel < oldLevel;
}

// Handle downgrade scenario - check limits and notify users
async function handleDowngrade(
  orgId: string,
  oldPlan: string,
  newPlan: string,
  newMaxContracts: number,
  newMaxUsers: number
) {
  // Get current usage
  const [contractCount, userCount, ownerAdmins] = await Promise.all([
    prisma.contract.count({
      where: { orgId },
    }),
    prisma.orgMember.count({
      where: { orgId },
    }),
    prisma.orgMember.findMany({
      where: {
        orgId,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: {
        userId: true,
      },
    }),
  ]);

  const exceedingContracts = contractCount > newMaxContracts;
  const exceedingUsers = userCount > newMaxUsers;

  // Create notifications for owners/admins if limits are exceeded
  if (exceedingContracts || exceedingUsers) {
    const notifications = ownerAdmins.map((member) => ({
      orgId,
      userId: member.userId,
      eventType: "PLAN_LIMIT_REACHED" as const,
      channel: "IN_APP" as const,
      status: "SENT" as const,
      sentAt: new Date(),
      title: "Limites excedidos após downgrade",
      message:
        `Você fez downgrade para o plano ${newPlan}. ` +
        (exceedingContracts
          ? `Você tem ${contractCount} contratos, mas o plano permite apenas ${newMaxContracts}. `
          : "") +
        (exceedingUsers
          ? `Você tem ${userCount} usuários, mas o plano permite apenas ${newMaxUsers}. `
          : "") +
        `Você não poderá criar novos contratos ou adicionar usuários até fazer upgrade ou reduzir a quantidade atual. ` +
        `Os recursos existentes continuam acessíveis para visualização e edição.`,
      metadata: {
        type: "downgrade",
        oldPlan,
        newPlan,
        contractCount,
        contractLimit: newMaxContracts,
        exceedingContracts,
        userCount,
        userLimit: newMaxUsers,
        exceedingUsers,
      },
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    console.log(
      `Downgrade notification created for org ${orgId}: ${contractCount}/${newMaxContracts} contracts, ${userCount}/${newMaxUsers} users`
    );
  }
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
):
  | "ACTIVE"
  | "CANCELED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "PAST_DUE"
  | "TRIALING"
  | "UNPAID" {
  const statusMap: Record<Stripe.Subscription.Status, any> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    unpaid: "UNPAID",
    paused: "CANCELED",
  };

  return statusMap[stripeStatus] || "ACTIVE";
}
