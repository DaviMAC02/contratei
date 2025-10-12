import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, emailTemplates } from "@/lib/email";
import { addDays, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

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

    // Get all active organizations
    const orgs = await prisma.org.findMany({
      where: {
        plan: { not: "FREE" }, // Only paid plans
      },
      include: {
        alertSettings: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    let processedOrgs = 0;
    const errors: any[] = [];

    for (const org of orgs) {
      try {
        await processOrgAlerts(org);
        processedOrgs++;
      } catch (error: any) {
        console.error(`[${jobId}] Error processing org ${org.id}:`, error);
        errors.push({
          orgId: org.id,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log job execution
    await prisma.cronJob.create({
      data: {
        jobName: "daily-alerts",
        status: errors.length > 0 ? "failed" : "success",
        duration,
        processedOrgs,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    console.log(
      `[${jobId}] Completed in ${duration}ms. Processed ${processedOrgs} orgs`
    );

    return NextResponse.json({
      success: true,
      processedOrgs,
      duration,
      errors: errors.length,
    });
  } catch (error: any) {
    console.error(`[${jobId}] Fatal error:`, error);

    await prisma.cronJob.create({
      data: {
        jobName: "daily-alerts",
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

async function processOrgAlerts(org: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get contracts that need alerts
  const contracts = await prisma.contract.findMany({
    where: {
      orgId: org.id,
      status: { in: ["ACTIVE", "DUE_SOON"] },
    },
    include: {
      owner: true,
    },
  });

  for (const contract of contracts) {
    if (!contract.nextRenewalDate) continue;

    const daysUntilExpiry = Math.ceil(
      (contract.nextRenewalDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Check if contract is expired
    if (daysUntilExpiry < 0 && contract.status !== "EXPIRED") {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: "EXPIRED" },
      });

      await sendExpiredAlert(org, contract);
      continue;
    }

    // Update status to DUE_SOON if within 90 days
    if (daysUntilExpiry <= 90 && contract.status === "ACTIVE") {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: "DUE_SOON" },
      });
    }

    // Send alerts based on settings
    const alertSetting = org.alertSettings.find(
      (s: any) => s.eventType === "CONTRACT_DUE_SOON"
    );

    if (alertSetting?.enabled) {
      for (const daysBefore of alertSetting.daysBeforeArray) {
        if (daysUntilExpiry === daysBefore) {
          // Check idempotency
          const existing = await prisma.alertLog.findUnique({
            where: {
              orgId_date_eventType_contractId: {
                orgId: org.id,
                date: today,
                eventType: "CONTRACT_DUE_SOON",
                contractId: contract.id,
              },
            },
          });

          if (!existing) {
            await sendDueSoonAlert(org, contract, daysBefore);

            await prisma.alertLog.create({
              data: {
                orgId: org.id,
                date: today,
                eventType: "CONTRACT_DUE_SOON",
                contractId: contract.id,
                userId: contract.ownerUserId,
                processed: true,
              },
            });
          }
        }
      }
    }

    // Check for adjustment due
    if (contract.adjustmentType !== "NONE" && contract.adjustmentValue) {
      const oneYearAgo = addDays(today, -365);
      const lastAdjustment = await prisma.contractAdjustment.findFirst({
        where: {
          contractId: contract.id,
        },
        orderBy: {
          adjustmentDate: "desc",
        },
      });

      const lastAdjustmentDate =
        lastAdjustment?.adjustmentDate || contract.startDate;

      if (lastAdjustmentDate <= oneYearAgo) {
        await sendAdjustmentDueAlert(org, contract);
      }
    }
  }
}

async function sendDueSoonAlert(org: any, contract: any, daysBefore: number) {
  const locale = org.locale as "pt-BR" | "en-US";
  const template = emailTemplates.contractDueSoon[locale];

  const dueDate = format(contract.nextRenewalDate, "PPP", {
    locale: locale === "pt-BR" ? require("date-fns/locale/pt-BR") : undefined,
  });

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: contract.owner.email,
    subject: template.subject(daysBefore),
    html: template.getHtml(
      contract.title,
      contract.supplierName,
      dueDate,
      daysBefore
    ),
  });

  await prisma.notification.create({
    data: {
      orgId: org.id,
      userId: contract.ownerUserId,
      eventType: "CONTRACT_DUE_SOON",
      channel: "EMAIL",
      status: "SENT",
      title: template.subject(daysBefore),
      message: `Contract ${contract.title} is due in ${daysBefore} days`,
      metadata: { contractId: contract.id, daysBefore },
      sentAt: new Date(),
    },
  });
}

async function sendExpiredAlert(org: any, contract: any) {
  const locale = org.locale as "pt-BR" | "en-US";
  const template = emailTemplates.contractExpired[locale];

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: contract.owner.email,
    subject: template.subject,
    html: template.getHtml(contract.title, contract.supplierName),
  });

  await prisma.notification.create({
    data: {
      orgId: org.id,
      userId: contract.ownerUserId,
      eventType: "CONTRACT_EXPIRED",
      channel: "EMAIL",
      status: "SENT",
      title: template.subject,
      message: `Contract ${contract.title} has expired`,
      metadata: { contractId: contract.id },
      sentAt: new Date(),
    },
  });
}

async function sendAdjustmentDueAlert(org: any, contract: any) {
  const locale = org.locale as "pt-BR" | "en-US";
  const template = emailTemplates.adjustmentDue[locale];

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: contract.owner.email,
    subject: template.subject,
    html: template.getHtml(contract.title, contract.adjustmentValue.toString()),
  });

  await prisma.notification.create({
    data: {
      orgId: org.id,
      userId: contract.ownerUserId,
      eventType: "ADJUSTMENT_DUE",
      channel: "EMAIL",
      status: "SENT",
      title: template.subject,
      message: `Contract ${contract.title} is due for adjustment`,
      metadata: { contractId: contract.id },
      sentAt: new Date(),
    },
  });
}
