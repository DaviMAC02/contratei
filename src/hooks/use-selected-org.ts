"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useSelectedOrg() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Priority: session > URL parameter
    const orgIdFromSession = session?.selectedOrgId;
    const orgIdFromUrl = searchParams.get("orgId");

    if (orgIdFromSession) {
      setSelectedOrgId(orgIdFromSession);

      // Remove orgId from URL if present
      if (orgIdFromUrl) {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("orgId");
        const newUrl = `${window.location.pathname}${
          newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""
        }`;
        router.replace(newUrl);
      }
    } else if (orgIdFromUrl) {
      // Migrate from URL to session
      setSelectedOrgInSession(orgIdFromUrl);
    }
  }, [session, searchParams, router]);

  const setSelectedOrgInSession = async (orgId: string) => {
    try {
      // Verify access and update session
      const response = await fetch("/api/session/update-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });

      if (response.ok) {
        // Update the session on the client
        await update({ selectedOrgId: orgId });
        setSelectedOrgId(orgId);
      }
    } catch (error) {
      console.error("Error updating selected org:", error);
    }
  };

  return {
    selectedOrgId,
    setSelectedOrgId: setSelectedOrgInSession,
  };
}
