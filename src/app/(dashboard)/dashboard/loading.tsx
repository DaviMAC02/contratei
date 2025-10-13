import { Box, Typography, Skeleton } from "@mui/material";
import { Card as MuiCard, CardContent as MuiCardContent } from "@mui/material";

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header Skeleton */}
      <Box className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </Box>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <MuiCard
            key={i}
            sx={{
              borderRadius: 1,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <MuiCardContent className="p-5">
              <Box className="flex items-start justify-between mb-3">
                <Skeleton variant="rectangular" className="w-11 h-11 rounded-md" />
                <Skeleton className="w-16 h-4" />
              </Box>
              <Skeleton className="w-16 h-9 mb-2" />
              <Skeleton className="w-24 h-4" />
            </MuiCardContent>
          </MuiCard>
        ))}
      </div>

      {/* Recent Contracts Skeleton */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box className="p-6 border-b border-gray-200">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </Box>
        <MuiCardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        </MuiCardContent>
      </MuiCard>
    </div>
  );
}
