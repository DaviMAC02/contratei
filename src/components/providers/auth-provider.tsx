"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { SessionActivityMonitor } from "./session-activity-monitor";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={10 * 60} refetchOnWindowFocus={true}>
      <SessionActivityMonitor>{children}</SessionActivityMonitor>
    </SessionProvider>
  );
}
