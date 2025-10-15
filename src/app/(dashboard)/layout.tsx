import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthProvider } from "@/components/providers/auth-provider";
import { I18nProvider } from "@/lib/use-translation";
import type { Locale } from "@/lib/i18n";
import { DashboardLayoutClient } from "@/components/layout";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user has any organization
  const hasOrg = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    select: { orgId: true },
  });

  if (!hasOrg) {
    redirect("/onboarding");
  }

  // If user hasn't selected an org, redirect to select-org
  if (!session.selectedOrgId) {
    redirect("/select-org");
  }

  // Get selected org for locale
  const org = await prisma.org.findUnique({
    where: { id: session.selectedOrgId },
    select: { id: true, name: true, locale: true },
  });

  if (!org) {
    redirect("/select-org");
  }

  const locale = org.locale as Locale;

  return (
    <AuthProvider>
      <I18nProvider locale={locale}>
        <DashboardLayoutClient orgId={org.id} orgName={org.name}>
          {children}
        </DashboardLayoutClient>
      </I18nProvider>
    </AuthProvider>
  );
}
