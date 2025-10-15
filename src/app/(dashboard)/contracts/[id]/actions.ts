"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getContractDetailData(contractId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const [contract, files, orgs] = await Promise.all([
    trpc.contract.get({ orgId, id: contractId }),
    trpc.file.listFiles({ orgId, contractId }),
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
    adjustments: contract.adjustments.map((adj) => ({
      ...adj,
      oldValue: Number(adj.oldValue),
      newValue: Number(adj.newValue),
      percentage: Number(adj.percentage),
      adjustmentDate: new Date(adj.adjustmentDate),
    })),
    renewalHistory: contract.renewalHistory.map((renewal) => ({
      ...renewal,
      renewalDate: new Date(renewal.renewalDate),
      previousEndDate: new Date(renewal.previousEndDate),
      newEndDate: new Date(renewal.newEndDate),
    })),
  };

  // Serialize files
  const serializedFiles = files.map((file) => ({
    ...file,
    uploadedAt: new Date(file.uploadedAt),
  }));

  return {
    contract: serializedContract,
    files: serializedFiles,
    orgs,
    orgId,
    session,
  };
}

export async function renewContract(contractId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session.selectedOrgId) {
    throw new Error("No organization selected");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const result = await trpc.contract.renew({ orgId, id: contractId });

  return result;
}

export async function deleteContract(contractId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session.selectedOrgId) {
    throw new Error("No organization selected");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  await trpc.contract.delete({ orgId, id: contractId });

  return { success: true };
}
