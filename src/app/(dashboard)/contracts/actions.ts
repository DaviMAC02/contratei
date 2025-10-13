"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getContractsData(searchParams?: {
  search?: string;
  status?: string;
  cursor?: string;
  page?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // User must have selected an org to view contracts
  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const [contracts, org] = await Promise.all([
    trpc.contract.list({
      orgId,
      search: searchParams?.search || undefined,
      status: searchParams?.status as any,
      cursor: searchParams?.cursor || undefined,
      limit: 10,
    }),
    trpc.org.get({ orgId }),
  ]);

  // Serialize contracts to convert Decimal to number and Date objects
  const serializedContracts = contracts.contracts.map((contract) => ({
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
    lastAlertSentAt: contract.lastAlertSentAt
      ? new Date(contract.lastAlertSentAt)
      : null,
  }));

  return {
    contracts: serializedContracts,
    nextCursor: contracts.nextCursor,
    org,
    session,
  };
}
