"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  CreditCard,
  LogOut,
  Building,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/use-translation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { trpc } from "@/lib/trpc-client";

interface SidebarProps {
  orgId: string;
  orgName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  orgId,
  orgName,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const orgsQuery = trpc.org.list.useQuery();

  // Close sidebar on navigation for mobile
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  const handleOrgSwitch = (newOrgId: string) => {
    localStorage.setItem("selectedOrgId", newOrgId);
    // Keep the current pathname but update orgId
    const currentPath = pathname || "/dashboard";
    router.push(`${currentPath}?orgId=${newOrgId}`);
  };

  const navigation = [
    {
      name: t("nav.dashboard"),
      href: `/dashboard?orgId=${orgId}`,
      icon: LayoutDashboard,
    },
    {
      name: t("nav.contracts"),
      href: `/contracts?orgId=${orgId}`,
      icon: FileText,
    },
    {
      name: t("nav.team"),
      href: `/team?orgId=${orgId}`,
      icon: Users,
    },
    {
      name: t("nav.billing"),
      href: `/billing?orgId=${orgId}`,
      icon: CreditCard,
    },
    {
      name: t("nav.settings"),
      href: `/settings?orgId=${orgId}`,
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform duration-300 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo & Org Switcher */}
        <div className="flex h-16 items-center border-b px-4 justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {orgsQuery.data && orgsQuery.data.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 w-full hover:bg-accent rounded-lg px-2 py-1 transition-colors">
                  <Building className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold truncate flex-1 text-left">
                    {orgName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Switch Organization
                  </div>
                  <DropdownMenuSeparator />
                  {orgsQuery.data.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleOrgSwitch(org.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="truncate">{org.name}</span>
                      </div>
                      {org.id === orgId && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/select-org")}>
                    View All Organizations
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold truncate">
                  {orgName}
                </span>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("nav.logout")}
          </Button>
        </div>
      </div>
    </>
  );
}
