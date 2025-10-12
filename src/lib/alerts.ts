import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { hasPlanFeature, type PlanName } from "./stripe";
import type { AlertEventType, NotificationChannel } from "@prisma/client";

interface CreateAlertParams {
  orgId: string;
  userId: string;
  eventType: AlertEventType;
  title: string;
  message: string;
  metadata?: any;
}

/**
 * Creates and sends alerts based on org's alert settings
 */
export async function createAlert(params: CreateAlertParams) {
  const { orgId, userId, eventType, title, message, metadata } = params;

  // Check if org has automatic alerts enabled for their plan
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  // Check if plan supports automatic alerts
  if (!hasPlanFeature(org.plan as PlanName, "automaticAlerts")) {
    console.log(
      `Skipping alert for org ${orgId} - plan ${org.plan} doesn't support automatic alerts`
    );
    return null;
  }

  // Get alert settings for this event type
  const alertSetting = await prisma.alertSetting.findUnique({
    where: {
      orgId_eventType: {
        orgId,
        eventType,
      },
    },
  });

  // If alerts are disabled for this event type, skip
  if (alertSetting && !alertSetting.enabled) {
    console.log(`Alerts disabled for ${eventType} in org ${orgId}`);
    return null;
  }

  const channels = alertSetting?.channels || ["EMAIL", "IN_APP"];
  const notifications = [];

  // Create notification for each channel
  for (const channel of channels) {
    const notification = await prisma.notification.create({
      data: {
        orgId,
        userId,
        eventType,
        channel: channel as NotificationChannel,
        status: "PENDING",
        title,
        message,
        metadata,
      },
    });

    notifications.push(notification);

    // Send email if channel is EMAIL
    if (channel === "EMAIL") {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: title,
            html: `
              <h2>${title}</h2>
              <p>${message}</p>
              ${
                metadata?.contractTitle
                  ? `<p><strong>Contrato:</strong> ${metadata.contractTitle}</p>`
                  : ""
              }
              ${
                metadata?.contractEndDate
                  ? `<p><strong>Data de Vencimento:</strong> ${new Date(
                      metadata.contractEndDate
                    ).toLocaleDateString("pt-BR")}</p>`
                  : ""
              }
              <br>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts/${
              metadata?.contractId || ""
            }">Ver contrato</a></p>
            `,
          });

          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error("Failed to send email alert:", error);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: "FAILED" },
        });
      }
    }
  }

  return notifications;
}

/**
 * Check contracts that are due soon and send alerts
 */
export async function checkExpiringContracts() {
  const orgs = await prisma.org.findMany({
    where: {
      plan: {
        not: "FREE", // Only paid plans get automatic alerts
      },
    },
    select: {
      id: true,
      plan: true,
      alertSettings: true,
    },
  });

  let processedCount = 0;
  const errors = [];

  for (const org of orgs) {
    try {
      // Check if org has automatic alerts enabled
      if (!hasPlanFeature(org.plan as PlanName, "automaticAlerts")) {
        continue;
      }

      // Get alert settings for CONTRACT_DUE_SOON
      const alertSetting = org.alertSettings.find(
        (s) => s.eventType === "CONTRACT_DUE_SOON"
      );

      if (!alertSetting || !alertSetting.enabled) {
        continue;
      }

      const daysBeforeArray = alertSetting.daysBeforeArray;

      // Check contracts that are due in any of the configured days
      for (const daysBefore of daysBeforeArray) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find contracts expiring on target date
        const contracts = await prisma.contract.findMany({
          where: {
            orgId: org.id,
            nextRenewalDate: {
              gte: targetDate,
              lt: nextDay,
            },
          },
          include: {
            owner: true,
          },
        });

        for (const contract of contracts) {
          await createAlert({
            orgId: org.id,
            userId: contract.ownerUserId,
            eventType: "CONTRACT_DUE_SOON",
            title: `Contrato vencendo em ${daysBefore} dias`,
            message: `O contrato "${contract.title}" com ${
              contract.counterpartyName
            } vence em ${daysBefore} dias (${new Date(
              contract.nextRenewalDate!
            ).toLocaleDateString("pt-BR")}).`,
            metadata: {
              contractId: contract.id,
              contractTitle: contract.title,
              contractEndDate: contract.nextRenewalDate,
              daysBefore,
            },
          });

          // Update lastAlertSentAt
          await prisma.contract.update({
            where: { id: contract.id },
            data: { lastAlertSentAt: new Date() },
          });

          processedCount++;
        }
      }
    } catch (error) {
      console.error(`Error processing org ${org.id}:`, error);
      errors.push({ orgId: org.id, error: String(error) });
    }
  }

  return { processedCount, errors };
}

/**
 * Check contracts that need automatic adjustment
 */
export async function checkContractsForAdjustment() {
  const orgs = await prisma.org.findMany({
    where: {
      plan: {
        in: ["GROWTH", "PRO", "STUDIO"], // Only plans with automatic adjustments
      },
    },
    select: { id: true, plan: true },
  });

  let processedCount = 0;
  const errors = [];

  for (const org of orgs) {
    try {
      // Check if org has automatic adjustments enabled
      if (!hasPlanFeature(org.plan as PlanName, "automaticAdjustments")) {
        continue;
      }

      // Find contracts that need adjustment (1 year since start or last adjustment)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const contracts = await prisma.contract.findMany({
        where: {
          orgId: org.id,
          adjustmentType: {
            not: "NONE",
          },
          startDate: {
            lte: oneYearAgo,
          },
        },
        include: {
          owner: true,
          adjustments: {
            orderBy: { adjustmentDate: "desc" },
            take: 1,
          },
        },
      });

      for (const contract of contracts) {
        // Check if already adjusted recently
        const lastAdjustment = contract.adjustments[0];
        if (lastAdjustment && lastAdjustment.adjustmentDate > oneYearAgo) {
          continue;
        }

        // Calculate new value based on manual adjustment percentage
        if (!contract.adjustmentValue) {
          console.log(
            `Contract ${contract.id} has adjustment enabled but no percentage set`
          );
          continue;
        }

        const adjustmentPercentage = Number(contract.adjustmentValue);
        const newValue = contract.valueAmount.mul(
          1 + adjustmentPercentage / 100
        );

        // Create adjustment record
        await prisma.contractAdjustment.create({
          data: {
            contractId: contract.id,
            orgId: org.id,
            adjustmentDate: new Date(),
            oldValue: contract.valueAmount,
            newValue,
            percentage: adjustmentPercentage,
            reason: `Automatic adjustment of ${adjustmentPercentage}% per year`,
            appliedBy: contract.ownerUserId,
          },
        });

        // Update contract value
        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            valueAmount: newValue,
          },
        });

        // Send alert
        await createAlert({
          orgId: org.id,
          userId: contract.ownerUserId,
          eventType: "ADJUSTMENT_DUE",
          title: "Reajuste automático aplicado",
          message: `O contrato "${
            contract.title
          }" teve reajuste automático de ${adjustmentPercentage.toFixed(
            2
          )}% aplicado. Novo valor: ${newValue.toString()}.`,
          metadata: {
            contractId: contract.id,
            contractTitle: contract.title,
            previousValue: contract.valueAmount.toString(),
            newValue: newValue.toString(),
            adjustmentPercentage,
          },
        });

        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing org ${org.id}:`, error);
      errors.push({ orgId: org.id, error: String(error) });
    }
  }

  return { processedCount, errors };
}

/**
 * Process automatic contract renewals
 */
export async function processAutomaticRenewals() {
  const orgs = await prisma.org.findMany({
    where: {
      plan: {
        not: "FREE",
      },
    },
    select: { id: true, plan: true },
  });

  let processedCount = 0;
  const errors = [];

  for (const org of orgs) {
    try {
      // Check if org has automatic renewal enabled
      if (!hasPlanFeature(org.plan as PlanName, "automaticRenewal")) {
        continue;
      }

      // Find contracts that expired today and have autoRenew enabled
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const contracts = await prisma.contract.findMany({
        where: {
          orgId: org.id,
          autoRenew: true,
          nextRenewalDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          owner: true,
        },
      });

      for (const contract of contracts) {
        // Calculate new end date based on periodicity
        let newEndDate = new Date(contract.nextRenewalDate!);

        switch (contract.periodicity) {
          case "MONTHLY":
            newEndDate.setMonth(newEndDate.getMonth() + 1);
            break;
          case "YEARLY":
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            break;
          case "CUSTOM_DAYS":
            if (contract.customDays) {
              newEndDate.setDate(newEndDate.getDate() + contract.customDays);
            }
            break;
        }

        // Create renewal history record
        await prisma.renewalHistory.create({
          data: {
            contractId: contract.id,
            orgId: org.id,
            renewalDate: new Date(),
            previousEndDate: contract.endDate!,
            newEndDate,
            renewedBy: contract.ownerUserId,
          },
        });

        // Update contract
        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            endDate: newEndDate,
            nextRenewalDate: newEndDate,
            status: "ACTIVE",
          },
        });

        // Send alert
        await createAlert({
          orgId: org.id,
          userId: contract.ownerUserId,
          eventType: "RENEWAL_REMINDER",
          title: "Contrato renovado automaticamente",
          message: `O contrato "${
            contract.title
          }" foi renovado automaticamente. Nova data de vencimento: ${newEndDate.toLocaleDateString(
            "pt-BR"
          )}.`,
          metadata: {
            contractId: contract.id,
            contractTitle: contract.title,
            previousEndDate: contract.endDate,
            newEndDate,
          },
        });

        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing org ${org.id}:`, error);
      errors.push({ orgId: org.id, error: String(error) });
    }
  }

  return { processedCount, errors };
}
