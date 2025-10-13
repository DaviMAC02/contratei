"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
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
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionCheckTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check for inactivity and log out if needed
  const checkInactivity = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      console.log("Session expired due to inactivity");
      await signOut({
        callbackUrl: "/auth/signin?timeout=true",
      });
    }
  }, []);

  // Refresh the session to extend token expiry
  const refreshSession = useCallback(async () => {
    if (status === "authenticated") {
      try {
        await update();
        console.log("Session refreshed");
      } catch (error) {
        console.error("Failed to refresh session:", error);
      }
    }
  }, [status, update]);

  // Setup activity listeners
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    // Add activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up inactivity checker
    inactivityTimerRef.current = setInterval(checkInactivity, 60 * 1000); // Check every minute

    // Set up session refresh (every 5 minutes if user is active)
    sessionCheckTimerRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      // Only refresh if user was active in the last 5 minutes
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        refreshSession();
      }
    }, SESSION_CHECK_INTERVAL);

    // Cleanup
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
    };
  }, [status, updateActivity, checkInactivity, refreshSession]);

  // Reset activity timer on route change
  useEffect(() => {
    if (status === "authenticated") {
      updateActivity();
    }
  }, [pathname, status, updateActivity]);

  // Handle page visibility change
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if session expired while tab was hidden
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          signOut({
            callbackUrl: "/auth/signin?timeout=true",
          });
        } else {
          // Update activity and refresh session
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
