"use client";

import { useEffect } from "react";
import { Button, Card, CardContent, Typography, Box } from "@mui/material";
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
    <Box sx={{ p: 4 }}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            PostHog Test Page
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Environment Variables:
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: "#f3f4f6",
                  p: 2,
                  borderRadius: 1,
                  fontSize: "0.875rem",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(
                  {
                    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY
                      ? "✅ Set"
                      : "❌ Not set",
                    NEXT_PUBLIC_POSTHOG_HOST: process.env
                      .NEXT_PUBLIC_POSTHOG_HOST
                      ? "✅ Set"
                      : "❌ Not set",
                    posthogLoaded: posthog.__loaded ? "✅ Yes" : "❌ No",
                  },
                  null,
                  2
                )}
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Test Events:
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  onClick={() =>
                    testEvent("feature_used", () =>
                      trackFeatureUsage("test_feature", "FREE")
                    )
                  }
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": { bgcolor: "#141f35" },
                    textTransform: "none",
                  }}
                >
                  Test Feature Usage
                </Button>

                <Button
                  variant="contained"
                  onClick={() =>
                    testEvent("contract_created", () =>
                      trackContractCreated(1000, true, false, "STARTER")
                    )
                  }
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": { bgcolor: "#141f35" },
                    textTransform: "none",
                  }}
                >
                  Test Contract Created
                </Button>

                <Button
                  variant="contained"
                  onClick={() =>
                    testEvent("plan_changed", () =>
                      trackPlanChange("FREE", "STARTER", "test-org-id")
                    )
                  }
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": { bgcolor: "#141f35" },
                    textTransform: "none",
                  }}
                >
                  Test Plan Change
                </Button>

                <Button
                  variant="contained"
                  onClick={() =>
                    testEvent("limit_reached", () =>
                      trackLimitReached("contracts", 3, 3, "FREE")
                    )
                  }
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": { bgcolor: "#141f35" },
                    textTransform: "none",
                  }}
                >
                  Test Limit Reached
                </Button>

                <Button
                  variant="contained"
                  onClick={() =>
                    testEvent("custom_event", () =>
                      posthog.capture("test_event", {
                        test: true,
                        timestamp: new Date().toISOString(),
                      })
                    )
                  }
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": { bgcolor: "#141f35" },
                    textTransform: "none",
                  }}
                >
                  Test Custom Event
                </Button>

                <Button
                  variant="contained"
                  onClick={() => {
                    console.log("🔍 PostHog instance:", posthog);
                    console.log("📊 PostHog config:", posthog.config);
                  }}
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": { bgcolor: "#141f35" },
                    textTransform: "none",
                  }}
                >
                  Log PostHog Info
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "#eff6ff",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: "#1e40af" }}>
                <strong>Instructions:</strong>
                <br />
                1. Check the console for logs
                <br />
                2. Click the buttons to send test events
                <br />
                3. Check your PostHog dashboard for events
                <br />
                4. Navigate to other pages to test pageview tracking
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
