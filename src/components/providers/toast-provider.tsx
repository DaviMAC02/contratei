"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";
import { getErrorMessage } from "@/lib/error-handler";

interface Toast {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface ToastContextValue {
  showToast: (
    message: string,
    severity?: AlertColor,
    duration?: number
  ) => void;
  showError: (error: unknown, context?: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, severity: AlertColor = "info", duration = 6000) => {
      const id = Math.random().toString(36).substring(7);
      const toast: Toast = { id, message, severity, duration };

      setToasts((prev) => [...prev, toast]);

      // Auto-hide after duration
      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    []
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showError = useCallback(
    (error: unknown, context?: string) => {
      const message = getErrorMessage(error, context);
      showToast(message, "error", 8000); // Longer duration for errors
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string, duration = 4000) => {
      showToast(message, "success", duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration = 6000) => {
      showToast(message, "warning", duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration = 4000) => {
      showToast(message, "info", duration);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          onClose={() => hideToast(toast.id)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          sx={{
            // Stack multiple toasts vertically
            top: `${80 + index * 70}px !important`,
          }}
        >
          <Alert
            onClose={() => hideToast(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{
              width: "100%",
              minWidth: 300,
              maxWidth: 600,
              fontSize: "1rem",
              boxShadow: 3,
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
