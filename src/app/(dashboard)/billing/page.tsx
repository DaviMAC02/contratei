import { Suspense } from "react";
import BillingClient from "@/components/features/billing/billing-client";
import { getBillingData } from "./actions";
import BillingLoading from "./loading";
async function BillingContent() {
  const { subscription, plans, analytics, org } = await getBillingData();

  return (
    <BillingClient
      subscription={subscription}
      plans={plans}
      analytics={analytics}
      org={org}
    />
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingContent />
    </Suspense>
  );
}
