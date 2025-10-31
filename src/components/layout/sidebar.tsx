"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutWithRevocation } from "@/lib/session-utils";
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
  BarChart3,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/use-translation";
import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "./notification-bell";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface SidebarProps {
  orgId: string;
  orgName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Styled components for modern look
const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 8,
  margin: "4px 8px",
  padding: "12px 16px",
  transition: "all 0.2s ease",
  position: "relative",
  "&:hover": {
    backgroundColor: "#f3f4f6",
  },
  "&.active": {
    backgroundColor: "#e8f4f2", // Light mint background
    color: "#1d2b48", // Dark blue text
    "&:hover": {
      backgroundColor: "#d9ede9", // Slightly darker mint on hover
    },
    "&::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
      width: 4,
      height: "60%",
      backgroundColor: "#1d2b48", // Dark blue accent bar
      borderRadius: "0 4px 4px 0",
    },
    "& .MuiListItemIcon-root": {
      color: "#1d2b48", // Dark blue icon
    },
    "& .MuiListItemText-primary": {
      color: "#1d2b48", // Dark blue text
      fontWeight: 600,
    },
  },
}));

export function Sidebar({
  orgId: propOrgId,
  orgName,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const { t } = useTranslation();
  const orgsQuery = trpc.org.list.useQuery();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Use session orgId if available, fallback to prop
  const currentOrgId = session?.selectedOrgId || propOrgId;

  // Find current org data
  const currentOrg = orgsQuery.data?.find((org) => org.id === currentOrgId);
  const currentOrgName = currentOrg?.name || orgName;

  // Close sidebar on navigation for mobile
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  // Clear navigating state when pathname changes
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleOrgMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleOrgMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOrgSwitch = async (newOrgId: string) => {
    try {
      const response = await fetch("/api/session/update-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: newOrgId }),
      });

      if (response.ok) {
        await update({ selectedOrgId: newOrgId });
        await queryClient.invalidateQueries();
        handleOrgMenuClose();
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = "/dashboard?_from_org_select=1";
      }
    } catch (error) {
      console.error("Error switching org:", error);
    }
  };

  const navigation = [
    {
      name: t("nav.dashboard"),
      href: `/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: t("nav.contracts"),
      href: `/contracts`,
      icon: FileText,
    },
    {
      name: "Uso do Plano",
      href: `/usage`,
      icon: BarChart3,
    },
    {
      name: t("nav.team"),
      href: `/team`,
      icon: Users,
    },
    {
      name: t("nav.billing"),
      href: `/billing`,
      icon: CreditCard,
    },
    {
      name: t("nav.settings"),
      href: `/settings`,
      icon: Settings,
    },
  ];

  const hasMultipleOrgs = orgsQuery.data && orgsQuery.data.length > 1;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <Box
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo and Notifications */}
        <Box className="flex h-20 items-center border-b border-gray-100 px-6 py-4 justify-between">
          <Link href="/dashboard" passHref style={{ cursor: "pointer" }}>
            <Image
              src="/logo.svg"
              alt="Contratei Logo"
              width={145}
              height={50}
              priority
              style={{ width: "145px", height: "50px" }}
            />
          </Link>
          {currentOrgId && <NotificationBell />}
        </Box>

        {/* Navigation */}
        <Box className="flex-1 py-3 custom-scrollbar overflow-y-auto">
          <List>
            {navigation.map((item) => {
              // Extract the path without query params for comparison
              const itemPath = item.href.split("?")[0];
              const currentPath = pathname || "";
              const isActive =
                currentPath === itemPath ||
                currentPath.startsWith(itemPath + "/");
              const isNavigating = navigatingTo === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.name} href={item.href} passHref legacyBehavior>
                  <StyledListItemButton
                    className={isActive ? "active" : ""}
                    onClick={() => {
                      if (!isActive) {
                        setNavigatingTo(item.href);
                      }
                    }}
                    disabled={isNavigating}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {isNavigating ? (
                        <CircularProgress size={20} sx={{ color: "#1d2b48" }} />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        fontSize: "0.9375rem",
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  </StyledListItemButton>
                </Link>
              );
            })}
          </List>
        </Box>

        {/* Bottom Section - User & Org unified */}
        <Box className="mt-auto border-t border-gray-100">
          <Box className="p-3 bg-gradient-to-br from-gray-50 to-white">
            {/* Org Switcher */}
            <Box className="mb-2 pb-2 border-b border-gray-200">
              {hasMultipleOrgs ? (
                <>
                  <Box
                    onClick={handleOrgMenuOpen}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#d1d5db",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#1d2b48",
                        width: 32,
                        height: 32,
                      }}
                    >
                      <Building className="h-3.5 w-3.5" />
                    </Avatar>
                    <Box className="flex-1 min-w-0">
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#1f2937",
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {currentOrgName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6b7280",
                          fontSize: "0.6875rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Workspace
                      </Typography>
                    </Box>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  </Box>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleOrgMenuClose}
                    PaperProps={{
                      sx: {
                        width: 256,
                        mt: 1,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        borderRadius: "12px",
                      },
                    }}
                  >
                    {orgsQuery.data?.map((org) => (
                      <MenuItem
                        key={org.id}
                        onClick={() => handleOrgSwitch(org.id)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 1.5,
                          px: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Building className="h-4 w-4" />
                          <Typography variant="body2">{org.name}</Typography>
                        </Box>
                        {org.id === currentOrgId && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    padding: "8px 10px",
                    borderRadius: "10px",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#1d2b48",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Building className="h-3.5 w-3.5" />
                  </Avatar>
                  <Box className="flex-1 min-w-0">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: "0.8125rem",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentOrgName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6b7280",
                        fontSize: "0.6875rem",
                        lineHeight: 1.2,
                      }}
                    >
                      Workspace
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* User section */}
            <Box className="flex items-center gap-2.5 mb-2">
              <Avatar
                sx={{
                  bgcolor: "#1d2b48",
                  width: 36,
                  height: 36,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                }}
              >
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </Avatar>
              <Box className="flex-1 min-w-0">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#111827",
                    fontSize: "0.8125rem",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session?.user?.name || "User"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#6b7280",
                    fontSize: "0.6875rem",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                >
                  {session?.user?.email}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => signOutWithRevocation()}
              startIcon={<LogOut className="h-3.5 w-3.5" />}
              sx={{
                borderRadius: "10px",
                border: "1.5px solid #e5e7eb",
                color: "#6b7280",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.8125rem",
                py: 0.75,
                "&:hover": {
                  backgroundColor: "#fef2f2",
                  borderColor: "#fca5a5",
                  color: "#dc2626",
                },
              }}
            >
              {t("nav.logout")}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
