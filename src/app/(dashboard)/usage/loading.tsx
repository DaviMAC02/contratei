import { Box, Skeleton, Card as MuiCard, CardContent } from "@mui/material";

export default function UsageLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header Skeleton */}
      <Box className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton variant="rectangular" width={200} height={32} />
            <div className="flex items-center gap-2 mt-1">
              <Skeleton variant="rectangular" width={250} height={20} />
              <Skeleton variant="rectangular" width={60} height={24} />
            </div>
          </div>
        </div>
      </Box>

      {/* Usage Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Contract Card Skeleton */}
        <MuiCard
          sx={{
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <CardContent className="p-6">
            <Box className="flex items-center justify-between mb-4">
              <Box className="flex items-center gap-2">
                <Skeleton variant="rectangular" width={44} height={44} />
                <Skeleton variant="rectangular" width={120} height={28} />
              </Box>
            </Box>

            <Skeleton
              variant="rectangular"
              width="100%"
              height={20}
              className="mb-4"
            />

            <Box className="flex items-baseline justify-between mb-4">
              <Skeleton variant="rectangular" width={60} height={40} />
              <Skeleton variant="rectangular" width={100} height={24} />
            </Box>

            <Skeleton
              variant="rectangular"
              width="100%"
              height={8}
              className="mb-2"
            />
            <Skeleton
              variant="rectangular"
              width={80}
              height={16}
              className="mb-4"
            />

            <Skeleton variant="rectangular" width="100%" height={40} />
          </CardContent>
        </MuiCard>

        {/* Users Card Skeleton */}
        <MuiCard
          sx={{
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <CardContent className="p-6">
            <Box className="flex items-center justify-between mb-4">
              <Box className="flex items-center gap-2">
                <Skeleton variant="rectangular" width={44} height={44} />
                <Skeleton variant="rectangular" width={120} height={28} />
              </Box>
            </Box>

            <Skeleton
              variant="rectangular"
              width="100%"
              height={20}
              className="mb-4"
            />

            <Box className="flex items-baseline justify-between mb-4">
              <Skeleton variant="rectangular" width={60} height={40} />
              <Skeleton variant="rectangular" width={100} height={24} />
            </Box>

            <Skeleton
              variant="rectangular"
              width="100%"
              height={8}
              className="mb-2"
            />
            <Skeleton
              variant="rectangular"
              width={80}
              height={16}
              className="mb-4"
            />

            <Skeleton variant="rectangular" width="100%" height={40} />
          </CardContent>
        </MuiCard>
      </div>

      {/* Plan Overview Skeleton */}
      <MuiCard
        sx={{
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box className="p-6 pb-4">
          <Box className="flex items-center gap-3 mb-1">
            <Skeleton variant="rectangular" width={40} height={40} />
            <Skeleton variant="rectangular" width={180} height={28} />
          </Box>
          <Skeleton
            variant="rectangular"
            width={250}
            height={20}
            className="ml-11"
          />
        </Box>
        <CardContent className="p-6 pt-2">
          {/* Plan Badge */}
          <Box
            className="mb-5 p-4 rounded-lg"
            sx={{ bgcolor: "#f8fafc", border: "1px solid #e5e7eb" }}
          >
            <Box className="flex items-center justify-between mb-3">
              <Skeleton variant="rectangular" width={80} height={20} />
              <Skeleton variant="rectangular" width={100} height={32} />
            </Box>

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Box className="flex items-center gap-3">
                <Skeleton variant="rectangular" width={36} height={36} />
                <Box>
                  <Skeleton
                    variant="rectangular"
                    width={150}
                    height={16}
                    className="mb-1"
                  />
                  <Skeleton variant="rectangular" width={100} height={24} />
                </Box>
              </Box>

              <Box className="flex items-center gap-3">
                <Skeleton variant="rectangular" width={36} height={36} />
                <Box>
                  <Skeleton
                    variant="rectangular"
                    width={150}
                    height={16}
                    className="mb-1"
                  />
                  <Skeleton variant="rectangular" width={100} height={24} />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Features Grid */}
          <Box className="mb-5">
            <Skeleton
              variant="rectangular"
              width={180}
              height={24}
              className="mb-2.5"
            />
            <Box className="grid gap-2.5 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width="100%"
                  height={80}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Box>
          </Box>

          {/* Button */}
          <Skeleton variant="rectangular" width="100%" height={48} />
        </CardContent>
      </MuiCard>
    </div>
  );
}
