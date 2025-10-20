import { Box, Skeleton } from "@mui/material";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

export default function TeamLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header Skeleton */}
      <Box className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
      </Box>

      {/* Filters Skeleton */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          mb: 3,
        }}
      >
        <MuiCardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-48" />
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Results Info Skeleton */}
      <Box className="mb-4">
        <Skeleton className="h-4 w-48" />
      </Box>

      {/* Desktop Table Skeleton */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
        className="hidden md:block"
      >
        <TableContainer>
          <Table
            sx={{
              "& .MuiTableCell-root": {
                borderBottom: "1px solid #d1d5db",
                px: 3,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell align="center">
                    <div className="flex items-center gap-2 justify-center">
                      <Skeleton
                        variant="rectangular"
                        width={120}
                        height={20}
                        sx={{ borderRadius: 1 }}
                      />
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rectangular"
                      width={180}
                      height={20}
                      sx={{ borderRadius: 1, margin: "0 auto" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={28}
                      sx={{ borderRadius: 1, margin: "0 auto" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rectangular"
                      width={100}
                      height={20}
                      sx={{ borderRadius: 1, margin: "0 auto" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="circular"
                      width={32}
                      height={32}
                      sx={{ margin: "0 auto" }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </MuiCard>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-4">
        {[...Array(5)].map((_, i) => (
          <MuiCard
            key={i}
            sx={{
              borderRadius: 1,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <MuiCardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Skeleton
                    variant="rectangular"
                    width={150}
                    height={20}
                    sx={{ mb: 1, borderRadius: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={200}
                    height={16}
                    sx={{ mb: 2, borderRadius: 1 }}
                  />

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <Skeleton
                        variant="rectangular"
                        width={40}
                        height={12}
                        sx={{ mb: 1, borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={28}
                        sx={{ borderRadius: 1 }}
                      />
                    </div>
                    <div>
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={12}
                        sx={{ mb: 1, borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={100}
                        height={16}
                        sx={{ borderRadius: 1 }}
                      />
                    </div>
                  </div>

                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={32}
                    sx={{ borderRadius: 1 }}
                  />
                </div>
              </div>
            </MuiCardContent>
          </MuiCard>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <Box className="mt-6 flex justify-center">
        <Skeleton
          variant="rectangular"
          width={200}
          height={32}
          sx={{ borderRadius: 1 }}
        />
      </Box>
    </div>
  );
}
