import { Skeleton } from "@mui/material";
import { Box } from "@mui/material";

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Header Skeleton */}
      <Box className="mb-8 animate-pulse">
        <Skeleton variant="text" width="60%" height={48} className="mb-2" />
        <Skeleton variant="text" width="40%" height={24} />
      </Box>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={160}
            className="rounded-3xl"
            animation="wave"
          />
        ))}
      </div>

      {/* Contracts List Skeleton */}
      <Skeleton
        variant="rectangular"
        height={400}
        className="rounded-3xl"
        animation="wave"
      />
    </div>
  );
}

export function ContractListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Box
          key={i}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl"
        >
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="30%" height={16} />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" width={120} height={28} />
            <Skeleton
              variant="rectangular"
              width={100}
              height={36}
              className="rounded-lg"
            />
          </div>
        </Box>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Skeleton
      variant="rectangular"
      height={200}
      className="rounded-2xl"
      animation="wave"
    />
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Carregando...</p>
      </div>
    </div>
  );
}
