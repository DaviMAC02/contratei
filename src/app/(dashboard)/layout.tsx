import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthProvider } from "@/components/providers/auth-provider";
import { I18nProvider } from "@/lib/use-translation";
import type { Locale } from "@/lib/i18n";
import { DashboardLayoutClient } from "@/components/layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Get user's first organization
  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const locale = membership.org.locale as Locale;

  return (
    <AuthProvider>
      <I18nProvider locale={locale}>
        <DashboardLayoutClient
          orgId={membership.org.id}
          orgName={membership.org.name}
        >
          {children}
        </DashboardLayoutClient>
      </I18nProvider>
    </AuthProvider>
  );
}
