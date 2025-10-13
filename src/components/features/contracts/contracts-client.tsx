"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Tabs,
  Tab,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "@/lib/use-translation";
import {
  formatCurrency,
  formatDate,
  getStatusTranslationKey,
} from "@/lib/utils";
import { Plus, Download } from "lucide-react";
import Link from "next/link";
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

interface ContractsClientProps {
  initialContracts: Array<{
    id: string;
    title: string;
    status: string;
    contractType: string;
    counterpartyName: string;
    owner: { name: string | null };
    nextRenewalDate: Date | null;
    valueAmount: number;
    currency: string;
    [key: string]: any;
  }>;
  initialNextCursor?: string;
  org: {
    id: string;
    name: string;
    currency: string;
    locale: string;
    [key: string]: any;
  };
  initialSearch?: string;
  initialStatus?: string;
}

export default function ContractsClient({
  initialContracts,
  initialNextCursor,
  org,
  initialSearch = "",
  initialStatus = "",
}: ContractsClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [contractTypeTab, setContractTypeTab] = useState<
    "OUTBOUND" | "INBOUND" | "ALL"
  >("ALL");

  // Use initial data from server
  const contracts = initialContracts;
  const nextCursor = initialNextCursor;

  // Filter contracts by type based on active tab (client-side only for tabs)
  const filteredContracts =
    contractTypeTab === "ALL"
      ? contracts
      : contracts.filter((c: any) => c.contractType === contractTypeTab);

  // Update URL with new search params
  const updateFilters = (newSearch?: string, newStatus?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSearch !== undefined) {
      if (newSearch) {
        params.set("search", newSearch);
      } else {
        params.delete("search");
      }
    }

    if (newStatus !== undefined) {
      if (newStatus) {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }
    }

    // Reset to first page when filters change
    params.delete("cursor");
    params.delete("page");

    startTransition(() => {
      router.push(`/contracts?${params.toString()}`);
    });
  };

  // Handle pagination
  const handleNextPage = () => {
    if (nextCursor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", nextCursor);

      startTransition(() => {
        router.push(`/contracts?${params.toString()}`);
      });
    }
  };

  const handlePreviousPage = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cursor");

    startTransition(() => {
      router.push(`/contracts?${params.toString()}`);
    });
  };

  // Reset pagination when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateFilters(value, statusFilter);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updateFilters(search, value);
  };

  const handleTabChange = (value: "OUTBOUND" | "INBOUND" | "ALL") => {
    setContractTypeTab(value);
  };

  const hasNextPage = !!nextCursor;
  const hasPreviousPage = !!searchParams.get("cursor");

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
    const rows = filteredContracts.map((c: any) => [
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
      <Box className="mb-4">
        <Typography variant="body2" className="text-gray-600">
          Mostrando {filteredContracts.length} contrato
          {filteredContracts.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

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
                <TableCell align="center">{t("contracts.status")}</TableCell>
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
                    <TableCell align="center">{contract.owner.name}</TableCell>
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
                    <Typography variant="body2" className="font-medium mt-1">
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
                    <Typography variant="body2" className="font-medium mt-1">
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
                    <Typography variant="body2" className="font-medium mt-1">
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

      {/* Pagination */}
      {filteredContracts.length > 0 && (hasNextPage || hasPreviousPage) && (
        <Box className="mt-6 flex justify-center gap-2">
          <Button
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage || isPending}
            variant="outlined"
            sx={{
              borderColor: "#1d2b48",
              color: "#1d2b48",
              "&:hover": {
                bgcolor: "#b3efe5",
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
              "&:disabled": {
                borderColor: "#d1d5db",
                color: "#9ca3af",
              },
            }}
          >
            Anterior
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={!hasNextPage || isPending}
            variant="contained"
            sx={{
              bgcolor: "#1d2b48",
              "&:hover": {
                bgcolor: "#2d3b58",
              },
              "&:disabled": {
                bgcolor: "#d1d5db",
              },
            }}
          >
            Próxima
          </Button>
        </Box>
      )}
    </div>
  );
}
