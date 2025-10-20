"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getSettingsData() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // User must have selected an org to view settings
  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const org = await trpc.org.get({ orgId });

  return {
    org,
    session,
  };
}
