"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getUsageData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  try {
    const [stats, org] = await Promise.all([
      trpc.contract.getDashboardStats({
        orgId,
      }),
      trpc.org.get({ orgId }),
    ]);

    return {
      stats,
      org,
    };
  } catch (error) {
    console.error("Error fetching usage data:", error);
    throw error;
  }
}
