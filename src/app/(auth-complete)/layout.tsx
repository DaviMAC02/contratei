import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { prisma } from "@/lib/prisma";
import { createCaller } from "@/server/root";

export const dynamic = "force-dynamic";

export default async function AuthCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: true,
        memberships: true,
      },
    });

    if (user) {
      const hasGoogleAccount = user.accounts.some(
        (acc) => acc.provider === "google"
      );
      const hasOtherAccount = user.accounts.some(
        (acc) => acc.provider !== "google"
      );
      const hasOrg = user.memberships.length > 0;

      if (hasGoogleAccount && !hasOtherAccount && !hasOrg) {
        await prisma.account.deleteMany({
          where: { userId: user.id },
        });
        await prisma.user.delete({
          where: { id: user.id },
        });

        redirect("/auth/signin?error=OAuthAccountNotLinked");
      }
    }
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </AuthProvider>
  );
}
