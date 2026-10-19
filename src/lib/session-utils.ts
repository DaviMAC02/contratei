import { signOut as nextAuthSignOut } from "next-auth/react";
import { trpcStandalone } from "@/lib/trpc-standalone";

interface SignOutWithRevocationOptions {
  callbackUrl?: string;
  redirect?: true | false;
  reason?: string;
}

export async function signOutWithRevocation(
  options?: SignOutWithRevocationOptions
) {
  const { reason = "USER_LOGOUT", redirect, callbackUrl } = options || {};

  try {
    const result = await trpcStandalone.session.revokeSession.mutate({ reason });
    if (result.success) {
      console.log(`Revoked ${result.count} session(s) with reason: ${reason}`);
    }
  } catch (error) {
    console.error("Error revoking session:", error);
  }

  if (redirect === false) {
    await nextAuthSignOut({ redirect: false });
  } else {
    await nextAuthSignOut({ 
      redirect: redirect ?? true,
      callbackUrl: callbackUrl,
    } as any);
  }
}

