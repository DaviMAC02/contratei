import { Box, Skeleton } from "@mui/material";
import { Card as MuiCard, CardContent as MuiCardContent } from "@mui/material";

export default function BillingLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Current Plan Overview Skeleton */}
      <Box className="mb-4">
        <MuiCard
          sx={{
            borderRadius: 1,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <MuiCardContent className="p-4 md:p-6">
            <Box className="flex items-center justify-between flex-wrap gap-3">
              <Box className="flex items-center gap-2">
                <Skeleton
                  variant="rectangular"
                  className="w-11 h-11 rounded-xl"
                />
                <Box>
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </Box>
              </Box>
              <Skeleton className="h-9 w-48" />
            </Box>
          </MuiCardContent>
        </MuiCard>
      </Box>

      {/* Usage Statistics Header */}
      <Box className="mb-2">
        <Skeleton className="h-6 w-32" />
      </Box>

      {/* Usage Statistics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <MuiCard
            key={i}
            sx={{
              borderRadius: 1,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <MuiCardContent className="p-3">
              <Box className="flex items-start justify-between mb-2">
                <Skeleton
                  variant="rectangular"
                  className="w-11 h-11 rounded-xl"
                />
                <Skeleton className="w-12 h-5 rounded-full" />
              </Box>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </MuiCardContent>
          </MuiCard>
        ))}
      </div>

      {/* Plans Header with Toggle */}
      <Box className="flex items-center justify-between mb-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-40" />
      </Box>

      {/* Plans Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, i) => (
          <MuiCard
            key={i}
            sx={{
              borderRadius: 1,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <MuiCardContent className="p-3 pt-7">
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-4 w-full mb-3" />

              {/* Price */}
              <Box className="mb-3">
                <Skeleton className="h-10 w-32" />
              </Box>

              {/* Divider */}
              <Box className="border-t border-gray-200 mb-3" />

              {/* Features */}
              <Box className="mb-3">
                <Skeleton className="h-5 w-32 mb-2" />
                <div className="space-y-1.5">
                  {[...Array(5)].map((_, j) => (
                    <Box key={j} className="flex items-center gap-1.5">
                      <Skeleton variant="circular" className="w-4 h-4" />
                      <Skeleton className="h-4 flex-1" />
                    </Box>
                  ))}
                </div>
              </Box>

              {/* CTA Button */}
              <Skeleton className="h-11 w-full rounded-lg" />
            </MuiCardContent>
          </MuiCard>
        ))}
      </div>

      {/* Need Help Section Skeleton */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <MuiCardContent className="p-4">
          <Box className="flex items-center justify-between flex-wrap gap-3">
            <Box>
              <Skeleton className="h-6 w-64 mb-1" />
              <Skeleton className="h-4 w-96" />
            </Box>
            <Skeleton className="h-9 w-40" />
          </Box>
        </MuiCardContent>
      </MuiCard>
    </div>
  );
}
