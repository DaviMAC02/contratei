import { Box, Skeleton } from "@mui/material";
import { Card as MuiCard, CardContent as MuiCardContent } from "@mui/material";

export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 900 }}>
          {/* Header Skeleton */}
          <Box className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </Box>

          {/* Settings Cards Skeleton */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Organization Settings Card */}
            <MuiCard
              sx={{
                borderRadius: 1,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <MuiCardContent className="p-6">
                <Box className="flex items-center gap-2 mb-6">
                  <Skeleton
                    variant="rectangular"
                    className="w-10 h-10 rounded-md"
                  />
                  <Skeleton className="h-6 w-32" />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-40" />
                </Box>
              </MuiCardContent>
            </MuiCard>

            {/* Profile Settings Card */}
            <MuiCard
              sx={{
                borderRadius: 1,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <MuiCardContent className="p-6">
                <Skeleton className="h-6 w-40 mb-6" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-96" />
                </Box>
              </MuiCardContent>
            </MuiCard>

            {/* Notification Settings Card */}
            <MuiCard
              sx={{
                borderRadius: 1,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <MuiCardContent className="p-6">
                <Box className="flex items-center gap-2 mb-6">
                  <Skeleton
                    variant="rectangular"
                    className="w-10 h-10 rounded-md"
                  />
                  <Skeleton className="h-6 w-32" />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-40" />
                </Box>
              </MuiCardContent>
            </MuiCard>

            {/* Localization Card */}
            <MuiCard
              sx={{
                borderRadius: 1,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <MuiCardContent className="p-6">
                <Box className="flex items-center gap-2 mb-6">
                  <Skeleton
                    variant="rectangular"
                    className="w-10 h-10 rounded-md"
                  />
                  <Skeleton className="h-6 w-32" />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </Box>
              </MuiCardContent>
            </MuiCard>
          </Box>
        </Box>
      </Box>
    </div>
  );
}
