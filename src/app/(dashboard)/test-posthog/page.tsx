"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import posthog from "posthog-js";
import {
  trackFeatureUsage,
  trackContractCreated,
  trackPlanChange,
  trackLimitReached,
} from "@/components/providers/posthog-provider";

export default function TestPostHogPage() {
  useEffect(() => {
    console.log("🔍 PostHog Test Page Loaded");
    console.log("PostHog Key:", process.env.NEXT_PUBLIC_POSTHOG_KEY);
    console.log("PostHog Host:", process.env.NEXT_PUBLIC_POSTHOG_HOST);
    console.log("PostHog loaded:", posthog.__loaded);
  }, []);

  const testEvent = (eventName: string, callback: () => void) => {
    console.log(`🧪 Testing event: ${eventName}`);
    callback();
    console.log(`✅ Event ${eventName} sent`);
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>PostHog Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Environment Variables:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm">
              {JSON.stringify(
                {
                  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY
                    ? "✅ Set"
                    : "❌ Not set",
                  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST
                    ? "✅ Set"
                    : "❌ Not set",
                  posthogLoaded: posthog.__loaded ? "✅ Yes" : "❌ No",
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Test Events:</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() =>
                  testEvent("feature_used", () =>
                    trackFeatureUsage("test_feature", "FREE")
                  )
                }
              >
                Test Feature Usage
              </Button>

              <Button
                onClick={() =>
                  testEvent("contract_created", () =>
                    trackContractCreated(1000, true, false, "STARTER")
                  )
                }
              >
                Test Contract Created
              </Button>

              <Button
                onClick={() =>
                  testEvent("plan_changed", () =>
                    trackPlanChange("FREE", "STARTER", "test-org-id")
                  )
                }
              >
                Test Plan Change
              </Button>

              <Button
                onClick={() =>
                  testEvent("limit_reached", () =>
                    trackLimitReached("contracts", 3, 3, "FREE")
                  )
                }
              >
                Test Limit Reached
              </Button>

              <Button
                onClick={() =>
                  testEvent("custom_event", () =>
                    posthog.capture("test_event", {
                      test: true,
                      timestamp: new Date().toISOString(),
                    })
                  )
                }
              >
                Test Custom Event
              </Button>

              <Button
                onClick={() => {
                  console.log("🔍 PostHog instance:", posthog);
                  console.log("📊 PostHog config:", posthog.config);
                }}
              >
                Log PostHog Info
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-900">
              <strong>Instructions:</strong>
              <br />
              1. Check the console for logs
              <br />
              2. Click the buttons to send test events
              <br />
              3. Check your PostHog dashboard for events
              <br />
              4. Navigate to other pages to test pageview tracking
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
