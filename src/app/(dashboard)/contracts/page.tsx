"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { skipToken } from "@tanstack/react-query";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Skeleton,
  Pagination,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "@/lib/use-translation";
import {
  formatCurrency,
  formatDate,
  getStatusTranslationKey,
} from "@/lib/utils";
import {
  Plus,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";
import { DebouncedInput } from "@/components/shared/debounced-input";

const StatsCard = styled(MuiCard)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  transition: "all 0.2s ease",
  backgroundColor: "#ffffff",
  "&:hover": {
    boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
    borderColor: "#d1d5db",
  },
}));

export default function ContractsPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId, org }) => <ContractsContent orgId={orgId} org={org} />}
    </DashboardPageWrapper>
  );
}

function ContractsContent({ orgId, org }: { orgId: string; org: any }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [contractTypeTab, setContractTypeTab] = useState<
    "OUTBOUND" | "INBOUND" | "ALL"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const itemsPerPage = 10;

  const contractsQuery = trpc.contract.list.useQuery(
    orgId && orgId.trim()
      ? {
          orgId,
          search: search || undefined,
          status:
            statusFilter && statusFilter.trim()
              ? (statusFilter as any)
              : undefined,
          limit: itemsPerPage,
          cursor: cursors[currentPage - 1],
        }
      : skipToken
  );

  const contracts = contractsQuery.data?.contracts || [];
  const nextCursor = contractsQuery.data?.nextCursor;

  // Filter contracts by type based on active tab
  const filteredContracts =
    contractTypeTab === "ALL"
      ? contracts
      : contracts.filter((c) => c.contractType === contractTypeTab);

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (nextCursor) {
      setCurrentPage(currentPage + 1);
      if (!cursors[currentPage]) {
        setCursors([...cursors, nextCursor]);
      }
    }
  };

  // Reset pagination when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setCursors([undefined]);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setCursors([undefined]);
  };

  const handleTabChange = (value: "OUTBOUND" | "INBOUND" | "ALL") => {
    setContractTypeTab(value);
    setCurrentPage(1);
    setCursors([undefined]);
  };

  const hasNextPage = !!nextCursor;
  const hasPreviousPage = currentPage > 1;

  const exportCSV = () => {
    const headers = [
      "Tipo",
      "Título",
      "Contraparte",
      "Responsável",
      "Valor",
      "Status",
      "Próxima Renovação",
    ];
    const rows = filteredContracts.map((c) => [
      c.contractType === "INBOUND"
        ? "Prestando Serviço"
        : "Contratando Serviço",
      c.title,
      c.counterpartyName,
      c.owner.name || "",
      c.valueAmount.toString(),
      c.status,
      c.nextRenewalDate ? new Date(c.nextRenewalDate).toLocaleDateString() : "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contratos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <Box className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Typography
              variant="h4"
              className="font-semibold text-gray-900 mb-1"
            >
              {t("contracts.title")}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Gerencie todos os seus contratos recorrentes
            </Typography>
          </div>
          <Link href={`/contracts/new`} className="w-full sm:w-auto">
            <Button
              variant="contained"
              size="small"
              sx={{
                bgcolor: "#1d2b48",
                width: { xs: "100%", sm: "auto" },
                "&:hover": {
                  bgcolor: "#b3efe5",
                  color: "#1d2b48",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                },
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("contracts.new")}
            </Button>
          </Link>
        </div>
      </Box>

      {/* Tabs for Contract Type */}
      <Box className="mb-6">
        <Tabs
          value={contractTypeTab}
          onChange={(_, value) => handleTabChange(value as any)}
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "#1d2b48",
            },
          }}
        >
          <Tab
            label={`Todos (${contracts.length})`}
            value="ALL"
            sx={{
              "&.Mui-selected": { color: "#1d2b48" },
            }}
          />
          <Tab
            label={`Contratando (${
              contracts.filter((c) => c.contractType === "OUTBOUND").length
            })`}
            value="OUTBOUND"
            sx={{
              "&.Mui-selected": { color: "#1d2b48" },
            }}
          />
          <Tab
            label={`Prestando (${
              contracts.filter((c) => c.contractType === "INBOUND").length
            })`}
            value="INBOUND"
            sx={{
              "&.Mui-selected": { color: "#1d2b48" },
            }}
          />
        </Tabs>
      </Box>

      {/* Filters */}
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
            <DebouncedInput
              value={search}
              onChange={handleSearchChange}
              placeholder={t("form.search")}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleStatusFilterChange(e.target.value)
              }
              size="medium"
              sx={{
                width: { xs: "100%", sm: 192 },
                "& .MuiOutlinedInput-root": {
                  height: 42,
                },
              }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="DUE_SOON">Vence em Breve</option>
              <option value="EXPIRED">Vencido</option>
              <option value="CANCELED">Cancelado</option>
            </TextField>
            <Button
              variant="outlined"
              onClick={exportCSV}
              startIcon={<Download className="h-4 w-4" />}
              sx={{
                width: { xs: "100%", sm: "auto" },
                height: 42,
                minWidth: 120,
                borderColor: "#1d2b48",
                color: "#1d2b48",
                "&:hover": {
                  bgcolor: "#b3efe5",
                  borderColor: "rgba(0, 0, 0, 0.2)",
                  color: "#1d2b48",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                },
              }}
            >
              <span className="hidden sm:inline">{t("form.export")}</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Results Info */}
      {!contractsQuery.isLoading && (
        <Box className="mb-4">
          <Typography variant="body2" className="text-gray-600">
            Mostrando {filteredContracts.length} contrato
            {filteredContracts.length !== 1 ? "s" : ""} da página {currentPage}
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {contractsQuery.isLoading ? (
        <>
          {/* Table Loading - Desktop */}
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>{t("contracts.title")}</TableCell>
                    <TableCell>Contraparte</TableCell>
                    <TableCell>{t("contracts.owner")}</TableCell>
                    <TableCell>{t("contracts.value")}</TableCell>
                    <TableCell>{t("contracts.status")}</TableCell>
                    <TableCell>{t("contracts.nextRenewal")}</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton
                          variant="rounded"
                          width={100}
                          height={24}
                          sx={{ borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={180} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={140} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={120} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={100} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          variant="rounded"
                          width={80}
                          height={24}
                          sx={{ borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={100} height={20} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton
                          variant="rounded"
                          width={80}
                          height={32}
                          sx={{ ml: "auto", borderRadius: 1 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </MuiCard>

          {/* Card Loading - Mobile */}
          <div className="md:hidden space-y-3">
            {[1, 2, 3].map((i) => (
              <StatsCard key={i}>
                <MuiCardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" width={150} height={20} />
                      <Skeleton variant="text" width={110} height={16} />
                    </div>
                    <Skeleton
                      variant="rounded"
                      width={70}
                      height={24}
                      sx={{ borderRadius: 2 }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-2">
                      <Skeleton variant="text" width={70} height={14} />
                      <Skeleton variant="text" width={90} height={16} />
                    </div>
                    <div className="space-y-2">
                      <Skeleton variant="text" width={55} height={14} />
                      <Skeleton variant="text" width={75} height={16} />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <Skeleton variant="text" width={120} height={14} />
                    <Skeleton variant="text" width={90} height={16} />
                  </div>
                  <Skeleton
                    variant="rounded"
                    width="100%"
                    height={36}
                    sx={{ borderRadius: 1 }}
                  />
                </MuiCardContent>
              </StatsCard>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Table - Desktop View */}
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
                  "& .MuiTableHead-root .MuiTableCell-root": {
                    fontWeight: 600,
                    px: 4,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Tipo</TableCell>
                    <TableCell align="center">{t("contracts.title")}</TableCell>
                    <TableCell align="center">Contraparte</TableCell>
                    <TableCell align="center">{t("contracts.owner")}</TableCell>
                    <TableCell align="center">{t("contracts.value")}</TableCell>
                    <TableCell align="center">
                      {t("contracts.status")}
                    </TableCell>
                    <TableCell align="center">
                      {t("contracts.nextRenewal")}
                    </TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredContracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <p className="text-gray-500 mb-4">
                          Nenhum contrato encontrado.
                        </p>
                        <Link href={`/contracts/new`}>
                          <Button
                            variant="outlined"
                            sx={{
                              borderColor: "#1d2b48",
                              color: "#1d2b48",
                              "&:hover": {
                                bgcolor: "#b3efe5",
                                borderColor: "rgba(0, 0, 0, 0.2)",
                                color: "#1d2b48",
                                border: "1px solid rgba(0, 0, 0, 0.2)",
                              },
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar primeiro contrato
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell align="center">
                          <Chip
                            label={
                              contract.contractType === "INBOUND"
                                ? "Prestando"
                                : "Contratando"
                            }
                            size="small"
                            variant={
                              contract.contractType === "INBOUND"
                                ? "filled"
                                : "outlined"
                            }
                            sx={{
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              bgcolor:
                                contract.contractType === "INBOUND"
                                  ? "#e8f4f2"
                                  : "transparent",
                              color: "#1d2b48",
                              borderColor: "#1d2b48",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" className="font-medium">
                          {contract.title}
                        </TableCell>
                        <TableCell align="center">
                          {contract.counterpartyName}
                        </TableCell>
                        <TableCell align="center">
                          {contract.owner.name}
                        </TableCell>
                        <TableCell align="center">
                          {formatCurrency(
                            Number(contract.valueAmount),
                            contract.currency as any,
                            org?.locale
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={t(
                              `status.${getStatusTranslationKey(
                                contract.status
                              )}` as any
                            )}
                            size="small"
                            variant="outlined"
                            color={
                              contract.status === "ACTIVE"
                                ? "success"
                                : contract.status === "DUE_SOON"
                                ? "warning"
                                : "error"
                            }
                            sx={{
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {contract.nextRenewalDate
                            ? formatDate(contract.nextRenewalDate, org?.locale)
                            : "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Link href={`/contracts/${contract.id}`}>
                            <Button
                              variant="text"
                              size="small"
                              disableRipple
                              disableElevation
                              sx={{
                                color: "#1d2b48",
                                minWidth: "100px",
                                boxShadow: "none !important",
                                "&:hover": {
                                  bgcolor: "transparent !important",
                                  boxShadow: "none !important",
                                },
                                "&:active": {
                                  bgcolor: "transparent !important",
                                  boxShadow: "none !important",
                                },
                                "&:focus": {
                                  bgcolor: "transparent !important",
                                  boxShadow: "none !important",
                                },
                              }}
                            >
                              Ver Detalhes
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </MuiCard>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredContracts.length === 0 ? (
              <MuiCard
                sx={{
                  borderRadius: 1,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                <MuiCardContent className="text-center py-12">
                  <Typography variant="body2" className="text-gray-500 mb-4">
                    Nenhum contrato encontrado.
                  </Typography>
                  <Link href={`/contracts/new`}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: "#1d2b48",
                        color: "#1d2b48",
                        "&:hover": {
                          bgcolor: "#b3efe5",
                          borderColor: "rgba(0, 0, 0, 0.2)",
                          color: "#1d2b48",
                          border: "1px solid rgba(0, 0, 0, 0.2)",
                        },
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro contrato
                    </Button>
                  </Link>
                </MuiCardContent>
              </MuiCard>
            ) : (
              filteredContracts.map((contract) => (
                <StatsCard key={contract.id}>
                  <MuiCardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <Typography
                          variant="subtitle2"
                          className="font-medium truncate"
                        >
                          {contract.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-gray-500 mt-1"
                        >
                          {contract.counterpartyName}
                        </Typography>
                      </div>
                      <Chip
                        label={t(
                          `status.${getStatusTranslationKey(
                            contract.status
                          )}` as any
                        )}
                        size="small"
                        variant="outlined"
                        color={
                          contract.status === "ACTIVE"
                            ? "success"
                            : contract.status === "DUE_SOON"
                            ? "warning"
                            : "error"
                        }
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          height: 22,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 block"
                        >
                          Responsável
                        </Typography>
                        <Typography
                          variant="body2"
                          className="font-medium mt-1"
                        >
                          {contract.owner.name}
                        </Typography>
                      </div>
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 block"
                        >
                          Valor
                        </Typography>
                        <Typography
                          variant="body2"
                          className="font-medium mt-1"
                        >
                          {formatCurrency(
                            Number(contract.valueAmount),
                            contract.currency as any,
                            org?.locale
                          )}
                        </Typography>
                      </div>
                    </div>

                    {contract.nextRenewalDate && (
                      <div className="mb-3">
                        <Typography
                          variant="caption"
                          className="text-gray-500 block"
                        >
                          Próxima Renovação
                        </Typography>
                        <Typography
                          variant="body2"
                          className="font-medium mt-1"
                        >
                          {formatDate(contract.nextRenewalDate, org?.locale)}
                        </Typography>
                      </div>
                    )}

                    <Link href={`/contracts/${contract.id}`} className="block">
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{
                          borderColor: "#1d2b48",
                          color: "#1d2b48",
                          "&:hover": {
                            bgcolor: "transparent",
                            borderColor: "#1d2b48",
                            cursor: "pointer",
                          },
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </Link>
                  </MuiCardContent>
                </StatsCard>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {!contractsQuery.isLoading && filteredContracts.length > 0 && (
        <Box className="mt-6 flex justify-center">
          <Pagination
            count={hasNextPage ? currentPage + 1 : currentPage}
            page={currentPage}
            onChange={(_, page) => {
              if (page > currentPage) {
                handleNextPage();
              } else if (page < currentPage) {
                handlePreviousPage();
              }
            }}
            color="primary"
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
              },
            }}
          />
        </Box>
      )}
    </div>
  );
}
