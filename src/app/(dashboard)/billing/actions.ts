"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getBillingData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // User must have selected an org to view billing
  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const [subscription, plans, analytics, org] = await Promise.all([
    trpc.billing.getSubscription({ orgId }),
    trpc.billing.getPlans({ orgId }),
    trpc.billing.getAnalytics({ orgId }),
    trpc.org.get({ orgId }),
  ]);

  return {
    subscription,
    plans,
    analytics,
    org,
    session,
  };
}
