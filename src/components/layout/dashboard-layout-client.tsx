"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { IconButton, Box } from "@mui/material";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";

interface DashboardLayoutClientProps {
  orgId: string;
  orgName: string;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  orgId,
  orgName,
  children,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  // Trigger fade effect on route change
  useEffect(() => {
    setIsTransitioning(true);
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div className="flex h-screen">
      <Sidebar
        orgId={orgId}
        orgName={orgName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden flex items-center justify-between h-16 border-b px-4 bg-card">
          <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
            <IconButton
              onClick={() => setSidebarOpen(true)}
              sx={{ color: "#1d2b48" }}
            >
              <Menu className="h-6 w-6" />
            </IconButton>
            <span className="ml-4 font-semibold text-lg truncate">{orgName}</span>
          </Box>
          <NotificationBell />
        </div>
        <main
          className={`flex-1 overflow-y-auto bg-background transition-opacity duration-150 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
