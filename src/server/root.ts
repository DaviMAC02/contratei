import { createTRPCRouter } from "./trpc";
import { contractRouter } from "./routers/contract";
import { orgRouter } from "./routers/org";
import { billingRouter } from "./routers/billing";
import { fileRouter } from "./routers/file";

export const appRouter = createTRPCRouter({
  contract: contractRouter,
  org: orgRouter,
  billing: billingRouter,
  file: fileRouter,
});

export type AppRouter = typeof appRouter;
