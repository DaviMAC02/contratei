"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { signOutWithRevocation } from "@/lib/session-utils";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const DB_SESSION_CHECK_INTERVAL = 2 * 60 * 1000; // Check DB every 2 minutes
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
];

export function SessionActivityMonitor({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, update } = useSession();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionCheckTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const dbSessionCheckTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Use tRPC query for checking session validity in DB
  const { data: sessionValidity, refetch: refetchSessionValidity } =
    trpc.device.checkSession.useQuery(undefined, {
      enabled: status === "authenticated",
      refetchInterval: false, // We'll manually refetch via interval
      retry: false,
    });

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Initialize lastActivityRef on client side only
  useEffect(() => {
    if (lastActivityRef.current === 0) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  const checkInactivity = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      await signOutWithRevocation({
        callbackUrl: "/auth/signin?timeout=true",
        reason: "INACTIVITY_TIMEOUT",
      });
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (status === "authenticated") {
      try {
        await update();
      } catch (error) {
        console.error("Failed to refresh session:", error);
      }
    }
  }, [status, update]);

  // Check if session is valid in DB and sign out if revoked
  useEffect(() => {
    if (sessionValidity && !sessionValidity.valid) {
      console.log("Session no longer valid:", sessionValidity.reason);
      const revokeReason =
        sessionValidity.revokeReason || sessionValidity.reason;

      // Sign out without trying to revoke again (already revoked in DB)
      signOutWithRevocation({
        callbackUrl: `/auth/signin?error=${sessionValidity.reason}`,
        reason: revokeReason,
      });
    }
  }, [sessionValidity]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    inactivityTimerRef.current = setInterval(
      checkInactivity,
      SESSION_CHECK_INTERVAL
    );

    sessionCheckTimerRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        refreshSession();
      }
    }, SESSION_CHECK_INTERVAL);

    // Periodically check DB for session revocation (e.g., login from another device)
    dbSessionCheckTimerRef.current = setInterval(() => {
      refetchSessionValidity();
    }, DB_SESSION_CHECK_INTERVAL);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
      }
      if (dbSessionCheckTimerRef.current) {
        clearInterval(dbSessionCheckTimerRef.current);
      }
    };
  }, [
    status,
    updateActivity,
    checkInactivity,
    refreshSession,
    refetchSessionValidity,
  ]);

  // Track pathname changes only (not status changes to avoid false activity on session refresh)
  useEffect(() => {
    if (status === "authenticated" && pathname) {
      updateActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only track pathname, not status or updateActivity

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          signOutWithRevocation({
            callbackUrl: "/auth/signin?timeout=true",
            reason: "INACTIVITY_TIMEOUT",
          });
        } else {
          updateActivity();
          refreshSession();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, updateActivity, refreshSession]);

  return <>{children}</>;
}
