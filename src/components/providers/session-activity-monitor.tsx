"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { signOutWithRevocation } from "@/lib/session-utils";
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

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const checkInactivity = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      console.log("Session expired due to inactivity");
      
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
        console.log("Session refreshed");
      } catch (error) {
        console.error("Failed to refresh session:", error);
      }
    }
  }, [status, update]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    inactivityTimerRef.current = setInterval(checkInactivity, 60 * 1000);

    sessionCheckTimerRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        refreshSession();
      }
    }, SESSION_CHECK_INTERVAL);

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

  useEffect(() => {
    if (status === "authenticated") {
      updateActivity();
    }
  }, [pathname, status, updateActivity]);

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
