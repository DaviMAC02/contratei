import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

/**
 * Custom hook to handle organization selection logic
 * - Redirects to /select-org if user has multiple orgs and no orgId in URL
 * - Auto-selects if user has only one org
 * - Returns the selected orgId, org data, and loading state
 */
export function useOrgSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orgId, setOrgId] = useState<string | null>(null);
  const orgsQuery = trpc.org.list.useQuery();

  useEffect(() => {
    // Wait for orgs to load
    if (!orgsQuery.data) return;

    // First try to get orgId from URL
    const urlOrgId = searchParams.get("orgId");
    if (urlOrgId) {
      setOrgId(urlOrgId);
      localStorage.setItem("selectedOrgId", urlOrgId);
      return;
    }

    // If user has multiple orgs and no orgId in URL, redirect to select-org
    if (orgsQuery.data.length > 1) {
      router.push("/select-org");
      return;
    }

    // If only one org, use it automatically
    if (orgsQuery.data.length === 1) {
      setOrgId(orgsQuery.data[0].id);
      localStorage.setItem("selectedOrgId", orgsQuery.data[0].id);
    }
  }, [orgsQuery.data, searchParams, router]);

  // Find the current organization
  const currentOrg = orgsQuery.data?.find((o) => o.id === orgId);

  return {
    orgId,
    org: currentOrg,
    orgs: orgsQuery.data,
    isLoading: orgsQuery.isLoading,
  };
}
