"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { IconButton, Badge, Popover, Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { trpc } from "@/lib/trpc-client";
import { useSelectedOrg } from "@/hooks/use-selected-org";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const StyledPopover = styled(Popover)(({ theme }) => ({
  "& .MuiPaper-root": {
    width: 400,
    maxWidth: "90vw",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
}));

const NotificationItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'unread',
})<{ unread?: boolean }>(({ unread }) => ({
  padding: "12px 16px",
  borderBottom: "1px solid #f3f4f6",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  backgroundColor: unread ? "#f0f9ff" : "#ffffff",
  "&:hover": {
    backgroundColor: "#f9fafb",
  },
  "&:last-child": {
    borderBottom: "none",
  },
}));

export function NotificationBell() {
  const { selectedOrgId: orgId } = useSelectedOrg();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // Get unread count
  const { data: unreadData, refetch: refetchUnread } =
    trpc.notification.getUnreadCount.useQuery(
      { orgId: orgId || "" },
      { enabled: !!orgId, refetchInterval: 30000 } // Poll every 30 seconds
    );

  // Get notifications - only unread ones
  const { data: notificationsData, refetch: refetchNotifications } =
    trpc.notification.list.useQuery(
      { orgId: orgId || "", limit: 10, unreadOnly: true },
      { enabled: !!orgId && open }
    );

  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.notifications || [];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate({
        orgId: orgId || "",
        notificationId,
      });
    }
  };

  const handleMarkAllAsRead = () => {
    if (orgId) {
      markAllAsReadMutation.mutate({ orgId });
    }
  };

  // Get locale from session or default to pt-BR
  // Note: session doesn't have locale, we'll use ptBR as default
  const locale = ptBR;

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: "#1d2b48",
          position: "relative",
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.75rem",
            },
          }}
        >
          <Bell size={20} />
        </Badge>
      </IconButton>

      <StyledPopover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", maxHeight: 500 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1d2b48",
                fontSize: "1rem",
              }}
            >
              Notificações
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<CheckCheck size={14} />}
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                sx={{
                  color: "#1d2b48",
                  fontSize: "0.75rem",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#e5e7eb",
                  },
                }}
              >
                Marcar todas como lidas
              </Button>
            )}
          </Box>

          {/* Notifications List */}
          <Box sx={{ overflowY: "auto", maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <Box
                sx={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                <Typography variant="body2">
                  Nenhuma notificação
                </Typography>
              </Box>
            ) : (
              notifications.map((notification: any) => {
                const isRead = !!notification.readAt;
                const isPlanLimit =
                  notification.eventType === "PLAN_LIMIT_REACHED";

                return (
                  <NotificationItem
                    key={notification.id}
                    unread={!isRead}
                    onClick={() =>
                      handleNotificationClick(notification.id, isRead)
                    }
                  >
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: isRead ? 400 : 600,
                            color: "#1d2b48",
                            mb: 0.5,
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#6b7280",
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            mb: 1,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#9ca3af",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                                locale,
                              }
                            )}
                          </Typography>
                          {isPlanLimit && (
                            <Box
                              sx={{
                                padding: "2px 8px",
                                borderRadius: 1,
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            >
                              Importante
                            </Box>
                          )}
                        </Box>
                      </Box>
                      {!isRead && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#3b82f6",
                            mt: 1,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                  </NotificationItem>
                );
              })
            )}
          </Box>
        </Box>
      </StyledPopover>
    </>
  );
}

