/**
 * Standalone tRPC client for use in utility functions
 * (outside React components)
 */

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/root";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpcStandalone = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      // Include credentials (cookies) in requests
      fetch: async (url, options) => {
        return fetch(url as string, {
          ...options,
          credentials: "include",
        } as RequestInit);
      },
    }),
  ],
});

