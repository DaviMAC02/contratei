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

export async function createContractWithFiles(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  const trpc = await createCaller({ session });

  // Helper to get string value or undefined (not null)
  const getStringOrUndefined = (key: string): string | undefined => {
    const value = formData.get(key);
    return value ? (value as string) : undefined;
  };

  // Extract contract data
  const contractData = {
    orgId: formData.get("orgId") as string,
    title: formData.get("title") as string,
    contractType: formData.get("contractType") as any,
    counterpartyName: formData.get("counterpartyName") as string,
    counterpartyContact: getStringOrUndefined("counterpartyContact"),
    ownerUserId: formData.get("ownerUserId") as string,
    startDate: new Date(formData.get("startDate") as string),
    endDate: formData.get("endDate")
      ? new Date(formData.get("endDate") as string)
      : undefined,
    periodicity: formData.get("periodicity") as any,
    customDays: formData.get("customDays")
      ? parseInt(formData.get("customDays") as string)
      : undefined,
    autoRenew: formData.get("autoRenew") === "true",
    valueAmount: parseFloat(formData.get("valueAmount") as string),
    adjustmentType: formData.get("adjustmentType") as any,
    adjustmentValue: formData.get("adjustmentValue")
      ? parseFloat(formData.get("adjustmentValue") as string)
      : undefined,
    costCenter: getStringOrUndefined("costCenter"),
    tags:
      getStringOrUndefined("tags")
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [],
    notes: getStringOrUndefined("notes"),
  };

  let contract;

  try {
    // Create contract
    contract = await trpc.contract.create(contractData);

    // Upload files if any
    const files = formData.getAll("files") as File[];
    if (files && files.length > 0) {
      const crypto = await import("crypto");

      for (const file of files) {
        if (file.size > 0) {
          // Skip empty files
          // Convert file to base64
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileContent = buffer.toString("base64");

          // Calculate checksum
          const checksum = crypto
            .createHash("md5")
            .update(buffer)
            .digest("hex");

          // Upload file - if this fails, we need to rollback
          await trpc.file.uploadFile({
            orgId: contractData.orgId,
            contractId: contract.id,
            fileName: file.name,
            fileSize: file.size,
            fileType: "ATTACHMENT",
            mimeType: file.type || "application/octet-stream",
            fileContent,
            checksum,
          });
        }
      }
    }

    return contract;
  } catch (error) {
    // If contract was created but file upload failed, delete the contract (rollback)
    if (contract?.id) {
      try {
        await trpc.contract.delete({
          orgId: contractData.orgId,
          id: contract.id,
        });
        console.log(
          "Contract rolled back successfully due to file upload error"
        );
      } catch (deleteError) {
        console.error("Failed to rollback contract creation:", deleteError);
        // Log but don't throw - we want the original error to be thrown
      }
    }

    // Re-throw the original error so user sees the actual problem
    throw error;
  }
}
