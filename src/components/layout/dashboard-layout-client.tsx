"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { IconButton } from "@mui/material";
import { Sidebar } from "@/components/layout/sidebar";

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
        <div className="lg:hidden flex items-center h-16 border-b px-4 bg-card">
          <IconButton
            onClick={() => setSidebarOpen(true)}
            sx={{ color: "#1d2b48" }}
          >
            <Menu className="h-6 w-6" />
          </IconButton>
          <span className="ml-4 font-semibold text-lg truncate">{orgName}</span>
        </div>
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
