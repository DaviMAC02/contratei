import { Suspense } from "react";
import DashboardClient from "@/components/features/dashboard/dashboard-client";
import { getDashboardData } from "./actions";
import DashboardLoading from "./loading";

async function DashboardContent() {
  const { stats, contracts, org, session } = await getDashboardData();
  const userName = session.user.name?.split(" ")[0] || "User";

  return (
    <DashboardClient
      stats={stats}
      contracts={contracts}
      org={org}
      userName={userName}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
