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

export async function uploadFile(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    if (!session.selectedOrgId) {
      throw new Error("Nenhuma organização selecionada");
    }

    const orgId = session.selectedOrgId;
    const contractId = formData.get("contractId") as string;
    const file = formData.get("file") as File;
    const fileType =
      (formData.get("fileType") as "MAIN" | "ATTACHMENT") || "ATTACHMENT";

    if (!file || !contractId) {
      throw new Error("Arquivo e ID do contrato são obrigatórios");
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileContent = buffer.toString("base64");

    // Calculate checksum
    const crypto = await import("crypto");
    const checksum = crypto.createHash("md5").update(buffer).digest("hex");

    const trpc = await createCaller({ session });

    // Upload file directly to database
    const fileRecord = await trpc.file.uploadFile({
      orgId,
      contractId,
      fileName: file.name,
      fileSize: file.size,
      fileType,
      mimeType: file.type || "application/octet-stream",
      fileContent,
      checksum,
    });

    return { success: true, file: fileRecord };
  } catch (error: any) {
    console.error("Upload file error:", error);
    throw new Error(
      error.message || "Erro ao fazer upload do arquivo. Tente novamente."
    );
  }
}

export async function downloadFile(fileId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  if (!session.selectedOrgId) {
    throw new Error("Nenhuma organização selecionada");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  try {
    const fileData = await trpc.file.getFileContent({ orgId, fileId });
    return fileData;
  } catch (error: any) {
    console.error("Download file error:", error);
    throw new Error(
      error.message || "Erro ao fazer download do arquivo. Tente novamente."
    );
  }
}
