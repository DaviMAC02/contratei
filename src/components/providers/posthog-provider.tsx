"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";

// Initialize PostHog
if (typeof window !== "undefined" && !posthog.__loaded) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 PostHog loaded successfully");
        posthog.debug();
      }
    },
  });
}

export function PostHogPageview(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      console.log("📊 PostHog capturing pageview:", url);
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  // Identify user when session is available
  useEffect(() => {
    if (session?.user && posthog.__loaded) {
      console.log("👤 PostHog identifying user:", session.user.id);
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session]);

  return <></>;
}

// Helper functions to track feature usage
export const trackFeatureUsage = (
  feature: string,
  planName: string,
  metadata?: Record<string, any>
) => {
  if (!posthog.__loaded) {
    console.warn("⚠️ PostHog not loaded, skipping event");
    return;
  }
  console.log("📊 Tracking feature usage:", { feature, planName, metadata });
  posthog.capture("feature_used", {
    feature,
    plan: planName,
    ...metadata,
  });
};

export const trackPlanChange = (
  fromPlan: string,
  toPlan: string,
  orgId: string
) => {
  if (!posthog.__loaded) {
    console.warn("⚠️ PostHog not loaded, skipping event");
    return;
  }
  console.log("📊 Tracking plan change:", { fromPlan, toPlan, orgId });
  posthog.capture("plan_changed", {
    from_plan: fromPlan,
    to_plan: toPlan,
    org_id: orgId,
  });
};

export const trackLimitReached = (
  limitType: "contracts" | "users",
  current: number,
  max: number,
  planName: string
) => {
  if (!posthog.__loaded) {
    console.warn("⚠️ PostHog not loaded, skipping event");
    return;
  }
  console.log("📊 Tracking limit reached:", {
    limitType,
    current,
    max,
    planName,
  });
  posthog.capture("limit_reached", {
    limit_type: limitType,
    current_count: current,
    max_limit: max,
    plan: planName,
  });
};

export const trackContractCreated = (
  contractValue: number,
  autoRenew: boolean,
  adjustmentEnabled: boolean,
  planName: string
) => {
  if (!posthog.__loaded) {
    console.warn("⚠️ PostHog not loaded, skipping event");
    return;
  }
  console.log("📊 Tracking contract created:", {
    contractValue,
    autoRenew,
    adjustmentEnabled,
    planName,
  });
  posthog.capture("contract_created", {
    contract_value: contractValue,
    auto_renew: autoRenew,
    adjustment_enabled: adjustmentEnabled,
    plan: planName,
  });
};

export const trackAutomatedAction = (
  actionType: "alert" | "renewal" | "adjustment",
  contractId: string,
  planName: string
) => {
  if (!posthog.__loaded) {
    console.warn("⚠️ PostHog not loaded, skipping event");
    return;
  }
  console.log("📊 Tracking automated action:", {
    actionType,
    contractId,
    planName,
  });
  posthog.capture("automated_action", {
    action_type: actionType,
    contract_id: contractId,
    plan: planName,
  });
};
