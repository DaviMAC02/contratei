"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getNewContractData(searchParams?: { orgId?: string }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // User must have selected an org to create contracts
  if (!session.selectedOrgId && !searchParams?.orgId) {
    redirect("/select-org");
  }

  const orgId = searchParams?.orgId || session.selectedOrgId!;
  const trpc = await createCaller({ session });

  const [orgs, org, members] = await Promise.all([
    trpc.org.list(),
    trpc.org.get({ orgId }),
    trpc.org.listMembers({ orgId }),
  ]);

  return {
    orgs,
    org,
    members,
    orgId,
    session,
  };
}

export async function createContract(data: {
  orgId: string;
  title: string;
  contractType: string;
  counterpartyName: string;
  counterpartyContact?: string;
  ownerUserId: string;
  startDate: string;
  endDate?: string;
  periodicity: string;
  customDays?: number;
  autoRenew: boolean;
  valueAmount: number;
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

  const trpc = await createCaller({ session });

  const contractData = {
    orgId: data.orgId,
    title: data.title,
    contractType: data.contractType as any,
    counterpartyName: data.counterpartyName,
    counterpartyContact: data.counterpartyContact,
    ownerUserId: data.ownerUserId,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    periodicity: data.periodicity as any,
    customDays: data.customDays,
    autoRenew: data.autoRenew,
    valueAmount: data.valueAmount,
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

  const contract = await trpc.contract.create(contractData);

  return contract;
}
