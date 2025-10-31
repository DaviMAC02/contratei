import { prisma } from "./prisma";
import { sendEmail, emailTemplates } from "./email";
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

export async function createAlert(params: CreateAlertParams) {
  const { orgId, userId, eventType, title, message, metadata } = params;

  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  if (!hasPlanFeature(org.plan as PlanName, "automaticAlerts")) {
    console.log(
      `Skipping alert for org ${orgId} - plan ${org.plan} doesn't support automatic alerts`
    );
    return null;
  }

  const alertSetting = await prisma.alertSetting.findUnique({
    where: {
      orgId_eventType: {
        orgId,
        eventType,
      },
    },
  });

  if (alertSetting && !alertSetting.enabled) {
    console.log(`Alerts disabled for ${eventType} in org ${orgId}`);
    return null;
  }

  const channels = alertSetting?.channels || ["EMAIL", "IN_APP"];
  const notifications = [];

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

    if (channel === "EMAIL") {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user?.email) {
          if (eventType === "RENEWAL_REMINDER") {
            const contractUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${
              metadata?.contractId || ""
            }`;
            const subject = emailTemplates.renewalReminder["pt-BR"].subject();
            const html = emailTemplates.renewalReminder["pt-BR"].getHtml(
              metadata?.contractTitle || "Contrato",
              metadata?.previousEndDate ||
                metadata?.contractEndDate ||
                new Date(),
              metadata?.newEndDate || metadata?.contractEndDate || new Date(),
              contractUrl
            );

            await sendEmail({
              to: user.email,
              subject,
              html,
            });
          } else if (eventType === "CONTRACT_DUE_SOON") {
            const days = Number(metadata?.daysBefore ?? 0);
            const subject =
              emailTemplates.contractDueSoon["pt-BR"].subject(days);
            const html = emailTemplates.contractDueSoon["pt-BR"].getHtml(
              metadata?.contractTitle || "Contrato",
              metadata?.counterpartyName || "",
              metadata?.contractEndDate
                ? new Date(metadata.contractEndDate).toLocaleDateString("pt-BR")
                : new Date().toLocaleDateString("pt-BR"),
              days
            );

            await sendEmail({ to: user.email, subject, html });
          } else if (eventType === "CONTRACT_EXPIRED") {
            const subject = emailTemplates.contractExpired["pt-BR"].subject;
            const html = emailTemplates.contractExpired["pt-BR"].getHtml(
              metadata?.contractTitle || "Contrato",
              metadata?.counterpartyName || ""
            );

            await sendEmail({ to: user.email, subject, html });
          } else if (eventType === "ADJUSTMENT_APPLIED") {
            const subject = emailTemplates.adjustmentApplied["pt-BR"].subject;
            const formatBRL = (cents: string | number) =>
              new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(cents) / 100);

            const html = emailTemplates.adjustmentApplied["pt-BR"].getHtml(
              metadata?.contractTitle || "Contrato",
              String(metadata?.adjustmentPercentage ?? ""),
              formatBRL(String(metadata?.previousValue ?? "0")),
              formatBRL(String(metadata?.newValue ?? "0"))
            );

            await sendEmail({ to: user.email, subject, html });
          } else {
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
          }

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

async function getAlertRecipients(orgId: string, defaultUserId: string) {
  const members = await prisma.orgMember.findMany({
    where: { orgId, role: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true },
  });
  const ids = new Set<string>([defaultUserId]);
  for (const m of members) ids.add(m.userId);
  return Array.from(ids);
}

export async function checkExpiringContracts() {
  const orgs = await prisma.org.findMany({
    where: {
      plan: {
        not: "FREE",
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
      if (!hasPlanFeature(org.plan as PlanName, "automaticAlerts")) {
        continue;
      }

      const alertSetting = org.alertSettings.find(
        (s) => s.eventType === "CONTRACT_DUE_SOON"
      );

      if (!alertSetting || !alertSetting.enabled) {
        continue;
      }

      const daysBeforeArray = alertSetting.daysBeforeArray;

      for (const daysBefore of daysBeforeArray) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

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
          const recipients = await getAlertRecipients(
            org.id,
            contract.ownerUserId
          );
          for (const recipientId of recipients) {
            await createAlert({
              orgId: org.id,
              userId: recipientId,
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
                counterpartyName: contract.counterpartyName,
                daysBefore,
              },
            });
          }

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

export async function checkContractsForAdjustment() {
  const orgs = await prisma.org.findMany({
    where: {
      plan: {
        in: ["PRO", "ENTERPRISE"],
      },
    },
    select: { id: true, plan: true },
  });

  let processedCount = 0;
  const errors = [];

  for (const org of orgs) {
    try {
      if (!hasPlanFeature(org.plan as PlanName, "automaticAdjustments")) {
        continue;
      }

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
        const lastAdjustment = contract.adjustments[0];
        if (lastAdjustment && lastAdjustment.adjustmentDate > oneYearAgo) {
          continue;
        }

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

        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            valueAmount: newValue,
          },
        });

        const recipients = await getAlertRecipients(
          org.id,
          contract.ownerUserId
        );
        for (const recipientId of recipients) {
          await createAlert({
            orgId: org.id,
            userId: recipientId,
            eventType: "ADJUSTMENT_APPLIED",
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
        }

        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing org ${org.id}:`, error);
      errors.push({ orgId: org.id, error: String(error) });
    }
  }

  return { processedCount, errors };
}

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
      if (!hasPlanFeature(org.plan as PlanName, "automaticRenewal")) {
        continue;
      }

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
        const prevEnd = new Date(contract.nextRenewalDate!);
        const durationDays = contract.periodicityDays
          ? Number(contract.periodicityDays)
          : Math.max(
              1,
              Math.round(
                ((contract.endDate || contract.nextRenewalDate)!.getTime() -
                  contract.startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
        const newEndDate = new Date(prevEnd);
        newEndDate.setDate(newEndDate.getDate() + durationDays);

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

        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            endDate: newEndDate,
            nextRenewalDate: newEndDate,
            status: "ACTIVE",
          },
        });

        const recipients = await getAlertRecipients(
          org.id,
          contract.ownerUserId
        );
        for (const recipientId of recipients) {
          await createAlert({
            orgId: org.id,
            userId: recipientId,
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
        }

        processedCount++;
      }
    } catch (error) {
      console.error(`Error processing org ${org.id}:`, error);
      errors.push({ orgId: org.id, error: String(error) });
    }
  }

  return { processedCount, errors };
}
