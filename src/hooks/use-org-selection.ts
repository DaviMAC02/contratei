import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";

/**
 * Custom hook to handle organization selection logic
 * - Uses session to store selected orgId (secure)
 * - Redirects to /select-org if user has multiple orgs and no orgId selected
 * - Auto-selects if user has only one org
 * - Returns the selected orgId, org data, and loading state
 */
export function useOrgSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();
  const [orgId, setOrgId] = useState<string | null>(null);
  const orgsQuery = trpc.org.list.useQuery();

  useEffect(() => {
    // Wait for session and orgs to load
    if (!session || !orgsQuery.data) return;

    const handleOrgSelection = async () => {
      // Priority 1: orgId from session
      if (session.selectedOrgId) {
        // Verify user still has access to this org
        const hasAccess = orgsQuery.data?.some(
          (org) => org.id === session.selectedOrgId
        );
        if (hasAccess) {
          setOrgId(session.selectedOrgId);
          return;
        }
      }

      // Priority 2: orgId from URL (migrate to session)
      const urlOrgId = searchParams.get("orgId");
      if (urlOrgId) {
        const hasAccess = orgsQuery.data?.some((org) => org.id === urlOrgId);
        if (hasAccess) {
          // Update session with orgId from URL
          try {
            const response = await fetch("/api/session/update-org", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orgId: urlOrgId }),
            });

            if (response.ok) {
              await updateSession({ selectedOrgId: urlOrgId });
              setOrgId(urlOrgId);

              // Remove orgId from URL
              const newSearchParams = new URLSearchParams(
                searchParams.toString()
              );
              newSearchParams.delete("orgId");
              const newUrl = `${window.location.pathname}${
                newSearchParams.toString()
                  ? `?${newSearchParams.toString()}`
                  : ""
              }`;
              router.replace(newUrl);
              return;
            }
          } catch (error) {
            console.error("Error migrating orgId to session:", error);
          }
        }
      }

      // If user has only one org, auto-select it
      if (orgsQuery.data.length === 1) {
        const singleOrgId = orgsQuery.data[0].id;
        try {
          const response = await fetch("/api/session/update-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgId: singleOrgId }),
          });

          if (response.ok) {
            await updateSession({ selectedOrgId: singleOrgId });
            setOrgId(singleOrgId);
            return;
          }
        } catch (error) {
          console.error("Error setting default org:", error);
        }
      }

      // If user has multiple orgs and no orgId selected, redirect to select-org
      if (orgsQuery.data.length > 1) {
        router.push("/select-org");
      }
    };

    handleOrgSelection();
  }, [session, orgsQuery.data, searchParams, router, updateSession]);

  // Find the current organization
  const currentOrg = orgsQuery.data?.find((o) => o.id === orgId);

  return {
    orgId,
    org: currentOrg,
    orgs: orgsQuery.data,
    isLoading: orgsQuery.isLoading || !session,
  };
}
