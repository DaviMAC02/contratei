"use client";

import { Box, Pagination as MuiPagination } from "@mui/material";

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  hasNextPage,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const totalPages = hasNextPage ? currentPage + 1 : currentPage;

  console.log("Pagination render:", {
    currentPage,
    hasNextPage,
    totalPages,
    isLoading,
  });

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Box className="mt-6 flex justify-center">
      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => {
          console.log("Pagination clicked:", { page, currentPage });
          onPageChange(page);
        }}
        color="primary"
        showFirstButton
        showLastButton={false}
        sx={{
          "& .MuiPaginationItem-root": {
            color: "#1d2b48",
            "&.Mui-selected": {
              bgcolor: "#1d2b48",
              color: "#fff",
              "&:hover": {
                bgcolor: "#2d3b58",
              },
            },
            "&:hover": {
              bgcolor: "#b3efe5",
              border: "1px solid rgba(0, 0, 0, 0.2)",
            },
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          },
        }}
      />
    </Box>
  );
}
