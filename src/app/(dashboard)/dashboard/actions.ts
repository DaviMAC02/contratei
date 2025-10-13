"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getDashboardData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // User must have selected an org to view dashboard
  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const [stats, contracts, org] = await Promise.all([
    trpc.contract.getDashboardStats({ orgId }),
    trpc.contract.list({ orgId, limit: 5 }),
    trpc.org.get({ orgId }),
  ]);

  // Serialize contracts to convert Decimal to number
  const serializedContracts = contracts.contracts.map((contract) => ({
    ...contract,
    valueAmount: Number(contract.valueAmount),
    nextRenewalDate: contract.nextRenewalDate
      ? new Date(contract.nextRenewalDate)
      : null,
  }));

  return {
    stats,
    contracts: serializedContracts,
    org,
    session,
  };
}
