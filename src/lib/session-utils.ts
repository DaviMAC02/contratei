/**
 * Session utility functions for handling session revocation
 */

import { signOut as nextAuthSignOut } from "next-auth/react";
import { trpcStandalone } from "@/lib/trpc-standalone";

interface SignOutWithRevocationOptions {
  callbackUrl?: string;
  redirect?: true | false;
  reason?: string;
}

/**
 * Sign out with session revocation
 * Revokes the current session before signing out
 */
export async function signOutWithRevocation(
  options?: SignOutWithRevocationOptions
) {
  const { reason = "USER_LOGOUT", redirect, callbackUrl } = options || {};

  try {
    // Revoke current session before signing out using tRPC
    const result = await trpcStandalone.device.revokeSession.mutate({ reason });
    if (result.success) {
      console.log(`Revoked ${result.count} session(s) with reason: ${reason}`);
    }
  } catch (error) {
    console.error("Error revoking session:", error);
    // Continue with sign out even if revocation fails
    // This ensures user can always logout, even if revocation API fails
  }

  // Sign out user - construct options based on redirect flag
  if (redirect === false) {
    await nextAuthSignOut({ redirect: false });
  } else {
    await nextAuthSignOut({ 
      redirect: redirect ?? true,
      callbackUrl: callbackUrl,
    } as any);
  }
}

