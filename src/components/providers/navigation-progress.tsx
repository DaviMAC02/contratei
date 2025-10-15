"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LinearProgress } from "@mui/material";

/**
 * Navigation progress bar that shows at the top of the page during navigation
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Show loading bar when navigation starts
    setIsNavigating(true);

    // Hide loading bar after a short delay to allow page to render
    const timeout = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <LinearProgress
        sx={{
          height: 3,
          backgroundColor: "rgba(29, 43, 72, 0.1)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: "#1d2b48",
          },
        }}
      />
    </div>
  );
}
