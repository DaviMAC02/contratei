"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getTeamData(searchParams?: {
  search?: string;
  role?: string;
  cursor?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // User must have selected an org to view team
  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  const orgId = session.selectedOrgId;
  const trpc = await createCaller({ session });

  const membersData = await trpc.org.listMembers({
    orgId,
    search: searchParams?.search || undefined,
    role: searchParams?.role as any,
    cursor: searchParams?.cursor || undefined,
    limit: 10,
  });

  return {
    members: membersData.members,
    nextCursor: membersData.nextCursor,
    session,
  };
}
