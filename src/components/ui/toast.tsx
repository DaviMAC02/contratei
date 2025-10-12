"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  duration?: number;
}

const ToastContext = React.createContext<{
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export const useToast = () => React.useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 3000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-md w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({
  title,
  description,
  variant = "default",
  onClose,
}: ToastProps & { onClose: () => void }) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg shadow-lg bg-white border",
        {
          "border-green-200 bg-green-50": variant === "success",
          "border-red-200 bg-red-50": variant === "error",
          "border-yellow-200 bg-yellow-50": variant === "warning",
          "border-gray-200": variant === "default",
        }
      )}
    >
      <div className="flex-1">
        {title && (
          <h3
            className={cn("font-semibold text-sm mb-1", {
              "text-green-900": variant === "success",
              "text-red-900": variant === "error",
              "text-yellow-900": variant === "warning",
              "text-gray-900": variant === "default",
            })}
          >
            {title}
          </h3>
        )}
        {description && (
          <p
            className={cn("text-sm", {
              "text-green-700": variant === "success",
              "text-red-700": variant === "error",
              "text-yellow-700": variant === "warning",
              "text-gray-700": variant === "default",
            })}
          >
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export { Toast, Toaster };
