import { createTRPCRouter } from "./trpc";
import { contractRouter } from "./routers/contract";
import { orgRouter } from "./routers/org";
import { billingRouter } from "./routers/billing";
import { fileRouter } from "./routers/file";
import { authRouter } from "./routers/auth";
import { supportRouter } from "./routers/support";
import { notificationRouter } from "./routers/notification";
import { deviceRouter } from "./routers/device";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  contract: contractRouter,
  org: orgRouter,
  billing: billingRouter,
  file: fileRouter,
  support: supportRouter,
  notification: notificationRouter,
  device: deviceRouter,
});

export type AppRouter = typeof appRouter;

// Create server-side caller for use in Server Components and Actions
export async function createCaller({ session }: { session: Session | null }) {
  return appRouter.createCaller({
    session,
    prisma,
    requestId: "server-action",
    headers: new Headers(),
  });
}
