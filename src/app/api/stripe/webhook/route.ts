import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";

export const runtime = 'nodejs';

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
      plan,
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
