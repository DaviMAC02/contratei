"use client";

import { ReactNode } from "react";
import { useOrgSelection } from "@/hooks/use-org-selection";
import { OrgLoadingState, OrgNotSelectedState } from "./org-loading-state";

interface DashboardPageWrapperProps {
  children: (props: {
    orgId: string;
    org: ReturnType<typeof useOrgSelection>["org"];
  }) => ReactNode;
}

/**
 * Wrapper component for dashboard pages that handles org selection logic
 * Usage:
 * <DashboardPageWrapper>
 *   {({ orgId, org }) => (
 *     <div>Your page content here</div>
 *   )}
 * </DashboardPageWrapper>
 */
export function DashboardPageWrapper({ children }: DashboardPageWrapperProps) {
  const { orgId, org, isLoading: orgsLoading } = useOrgSelection();

  if (orgsLoading) {
    return <OrgLoadingState />;
  }

  if (!orgId || orgId === null) {
    return <OrgNotSelectedState />;
  }

  return <>{children({ orgId, org })}</>;
}
