"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function SessionStatusIndicator() {
  const { status } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!show || status !== "authenticated") {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        "bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg",
        "flex items-center gap-2 text-sm font-medium",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
      Sessão ativa
    </div>
  );
}
