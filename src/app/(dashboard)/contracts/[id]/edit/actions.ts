"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getEditContractData(contractId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const [contract, members, orgs] = await Promise.all([
    trpc.contract.get({ orgId, id: contractId }),
    trpc.org.listMembers({ orgId }),
    trpc.org.list(),
  ]);

  // Serialize contract data
  const serializedContract = {
    ...contract,
    valueAmount: Number(contract.valueAmount),
    adjustmentValue: contract.adjustmentValue
      ? Number(contract.adjustmentValue)
      : null,
    startDate: contract.startDate ? new Date(contract.startDate) : null,
    endDate: contract.endDate ? new Date(contract.endDate) : null,
    nextRenewalDate: contract.nextRenewalDate
      ? new Date(contract.nextRenewalDate)
      : null,
    lastAdjustmentAt: contract.lastAdjustmentAt
      ? new Date(contract.lastAdjustmentAt)
      : null,
  };

  return {
    contract: serializedContract,
    members,
    orgs,
    orgId,
    session,
  };
}

export async function updateContract(data: {
  contractId: string;
  title: string;
  contractType?: string;
  counterpartyName: string;
  counterpartyContact?: string;
  ownerUserId: string;
  endDate?: string;
  nextRenewalDate?: string;
  periodicityDays?: number;
  autoRenew: boolean;
  adjustmentType: string;
  adjustmentValue?: number;
  costCenter?: string;
  tags?: string;
  notes?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session.selectedOrgId) {
    throw new Error("No organization selected");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const updateData = {
    orgId,
    id: data.contractId,
    title: data.title,
    contractType: data.contractType as any,
    counterpartyName: data.counterpartyName,
    counterpartyContact: data.counterpartyContact,
    ownerUserId: data.ownerUserId,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    nextRenewalDate: data.nextRenewalDate
      ? new Date(data.nextRenewalDate)
      : undefined,
    periodicityDays: data.periodicityDays,
    autoRenew: data.autoRenew,
    adjustmentType: data.adjustmentType as any,
    adjustmentValue: data.adjustmentValue,
    costCenter: data.costCenter,
    tags:
      data.tags
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [],
    notes: data.notes,
  };

  const result = await trpc.contract.update(updateData);

  return result;
}
