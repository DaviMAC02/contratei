import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkExpiringContracts,
  checkContractsForAdjustment,
  processAutomaticRenewals,
} from "@/lib/alerts";

export const runtime = "nodejs";

// Secure this endpoint with a secret
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const jobId = `daily-${Date.now()}`;

  try {
    console.log(`[${jobId}] Starting daily cron job`);

    // Run all automated tasks
    const [alertsResult, adjustmentsResult, renewalsResult] = await Promise.all(
      [
        checkExpiringContracts(),
        checkContractsForAdjustment(),
        processAutomaticRenewals(),
      ]
    );

    const duration = Date.now() - startTime;
    const totalProcessed =
      alertsResult.processedCount +
      adjustmentsResult.processedCount +
      renewalsResult.processedCount;
    const allErrors = [
      ...alertsResult.errors,
      ...adjustmentsResult.errors,
      ...renewalsResult.errors,
    ];

    // Log job execution
    await prisma.cronJob.create({
      data: {
        jobName: "daily-alerts-renewals-adjustments",
        status: allErrors.length > 0 ? "failed" : "success",
        duration,
        processedOrgs: totalProcessed,
        errors: allErrors.length > 0 ? allErrors : undefined,
        metadata: {
          alerts: alertsResult.processedCount,
          adjustments: adjustmentsResult.processedCount,
          renewals: renewalsResult.processedCount,
        },
      },
    });

    console.log(
      `[${jobId}] Completed in ${duration}ms. Processed ${totalProcessed} items (${alertsResult.processedCount} alerts, ${adjustmentsResult.processedCount} adjustments, ${renewalsResult.processedCount} renewals)`
    );

    return NextResponse.json({
      success: true,
      processed: {
        alerts: alertsResult.processedCount,
        adjustments: adjustmentsResult.processedCount,
        renewals: renewalsResult.processedCount,
      },
      duration,
      errors: allErrors.length,
    });
  } catch (error: any) {
    console.error(`[${jobId}] Fatal error:`, error);

    await prisma.cronJob.create({
      data: {
        jobName: "daily-alerts-renewals-adjustments",
        status: "failed",
        duration: Date.now() - startTime,
        processedOrgs: 0,
        errors: [{ error: error.message }],
      },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
