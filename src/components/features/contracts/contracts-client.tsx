"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
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
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
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
import { DebouncedInput, Pagination } from "@/components/shared";

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

interface Contract {
  id: string;
  title: string;
  status: string;
  contractType: string;
  counterpartyName: string;
  owner: { name: string | null } | null;
  nextRenewalDate: string | Date | null;
  valueAmount: number;
  currency: string;
  [key: string]: any;
}

interface Org {
  id: string;
  name: string;
  currency: string;
  locale: string;
  [key: string]: any;
}

interface ContractsClientProps {
  initialContracts: Contract[];
  initialNextCursor?: string;
  org: Org;
  initialSearch?: string;
  initialStatus?: string;
}

function ContractsClientInner({
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

  // --- Stable value for search params string to avoid effects running on new object identity every render
  const searchParamsString = useMemo(
    () => searchParams?.toString() ?? "",
    [searchParams]
  );

  // Page from URL; URL is source of truth
  const currentPage = useMemo(
    () => parseInt(searchParams?.get("page") || "1", 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsString] // only re-evaluate when the serialized params change
  );

  // Local editable filter state (debounced input will update URL)
  const [search, setSearch] = useState(
    () => searchParams?.get("search") || initialSearch || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams?.get("status") || initialStatus || ""
  );

  // Snackbar state for error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep a ref for pagination cursors so we don't trigger rerenders by updating arrays
  const cursorsRef = useRef<(string | undefined)[]>([undefined]);

  // initial data (server-provided) - keep as stable references
  const contracts = useMemo(() => initialContracts || [], [initialContracts]);
  const nextCursor = initialNextCursor;

  // Sync local inputs when URL changes (e.g., back/forward navigation)
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    const urlStatus = searchParams?.get("status") || "";

    // Only set if different to avoid re-render loops
    setSearch((prev) => (prev === urlSearch ? prev : urlSearch));
    setStatusFilter((prev) => (prev === urlStatus ? prev : urlStatus));
  }, [searchParamsString, searchParams]);

  // Maintain cursorsRef when the URL cursor/page change
  useEffect(() => {
    const urlCursor = searchParams?.get("cursor") ?? undefined;
    const urlPage = currentPage;

    if (urlCursor && urlPage > 1) {
      // Ensure we have capacity
      if (cursorsRef.current.length < urlPage) {
        cursorsRef.current.length = urlPage; // expand with undefined slots
      }
      if (cursorsRef.current[urlPage - 1] !== urlCursor) {
        cursorsRef.current[urlPage - 1] = urlCursor;
      }
    }

    if (urlPage === 1 && !urlCursor) {
      cursorsRef.current = [undefined];
    }
  }, [searchParamsString, currentPage, searchParams]);

  // Filter contracts by tab
  const [contractTypeTab, setContractTypeTab] = useState<
    "OUTBOUND" | "INBOUND" | "ALL"
  >("ALL");

  const filteredContracts = useMemo(() => {
    if (contractTypeTab === "ALL") return contracts;
    return contracts.filter((c) => c.contractType === contractTypeTab);
  }, [contracts, contractTypeTab]);

  const hasNextPage = useMemo(() => !!nextCursor, [nextCursor]);

  // replace your existing updateFilters with this
  const updateFilters = useCallback(
    (newSearch?: string, newStatus?: string) => {
      // read current params fresh from searchParams to compare
      const currentParams = new URLSearchParams(searchParams?.toString() ?? "");
      const currentSearch = currentParams.get("search") || "";
      const currentStatus = currentParams.get("status") || "";

      // Decide whether filters are actually changing
      const searchChanged =
        newSearch !== undefined && newSearch !== currentSearch;
      const statusChanged =
        newStatus !== undefined && newStatus !== currentStatus;
      const anyFilterChanged = searchChanged || statusChanged;

      // Build next params starting from current (so we preserve unrelated params unless we intentionally remove)
      const params = new URLSearchParams(currentParams.toString());

      if (newSearch !== undefined) {
        if (newSearch) params.set("search", newSearch);
        else params.delete("search");
      }

      if (newStatus !== undefined) {
        if (newStatus) params.set("status", newStatus);
        else params.delete("status");
      }

      // Only reset pagination when the filters actually changed.
      if (anyFilterChanged) {
        params.delete("cursor");
        params.delete("page");
      }

      const url = `/contracts?${params.toString()}`;

      // Use replace for filter updates (keeps history tidy). If nothing changed, skip navigation.
      const areParamsIdentical = currentParams.toString() === params.toString();
      if (!areParamsIdentical) {
        startTransition(() => {
          router.replace(url);
        });
      }
    },
    [router, searchParams]
  );
  // Handlers
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      // Reset cursor history when user starts a new search
      cursorsRef.current = [undefined];
      updateFilters(value, statusFilter);
    },
    [statusFilter, updateFilters]
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value);
      cursorsRef.current = [undefined];
      updateFilters(search, value);
    },
    [search, updateFilters]
  );

  const handleTabChange = useCallback(
    (value: "OUTBOUND" | "INBOUND" | "ALL") => {
      setContractTypeTab(value);
    },
    []
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParamsString);
      params.set("page", page.toString());

      // logic to determine cursor param
      if (page === 1) {
        params.delete("cursor");
      } else if (page === currentPage + 1 && nextCursor) {
        // going forward one page: use nextCursor
        if (cursorsRef.current.length < page) {
          cursorsRef.current[page - 1] = nextCursor;
        } else if (!cursorsRef.current[page - 1]) {
          cursorsRef.current[page - 1] = nextCursor;
        }
        params.set("cursor", nextCursor);
      } else if (page === currentPage - 1) {
        // previous page
        if (page > 1 && cursorsRef.current[page - 1]) {
          params.set("cursor", cursorsRef.current[page - 1]!);
        } else {
          params.delete("cursor");
        }
      } else if (cursorsRef.current[page - 1]) {
        // jumping to previously visited page
        params.set("cursor", cursorsRef.current[page - 1]!);
      } else {
        // no known cursor -> clear it to let server decide (or you can warn)
        params.delete("cursor");
      }

      const newUrl = `/contracts?${params.toString()}`;
      // For explicit page navigation we push so user can go back, wrapped in transition
      startTransition(() => {
        router.push(newUrl, { scroll: false });
      });
    },
    [router, currentPage, nextCursor, searchParamsString]
  );

  const exportCSV = useCallback(() => {
    try {
      const headers = [
        "Tipo",
        "Título",
        "Contraparte",
        "Responsável",
        "Valor",
        "Status",
        "Próxima Renovação",
      ];
      const rows = filteredContracts.map((c) => {
        const tipo =
          c.contractType === "INBOUND"
            ? "Prestando Serviço"
            : "Contratando Serviço";
        const ownerName = c.owner?.name || "";
        const value =
          typeof c.valueAmount === "number"
            ? c.valueAmount.toString()
            : `${c.valueAmount ?? ""}`;
        const nextRenewal = c.nextRenewalDate
          ? new Date(c.nextRenewalDate).toLocaleDateString()
          : "";
        return [
          tipo,
          c.title,
          c.counterpartyName,
          ownerName,
          value,
          c.status,
          nextRenewal,
        ];
      });

      const csv = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contratos-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // release memory
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
      setErrorMessage("Falha ao exportar CSV. Por favor, tente novamente.");
    }
  }, [filteredContracts]);

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

      {/* Tabs */}
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
            sx={{ "&.Mui-selected": { color: "#1d2b48" } }}
          />
          <Tab
            label={`Contratando (${
              contracts.filter((c) => c.contractType === "OUTBOUND").length
            })`}
            value="OUTBOUND"
            sx={{ "&.Mui-selected": { color: "#1d2b48" } }}
          />
          <Tab
            label={`Prestando (${
              contracts.filter((c) => c.contractType === "INBOUND").length
            })`}
            value="INBOUND"
            sx={{ "&.Mui-selected": { color: "#1d2b48" } }}
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
                "& .MuiOutlinedInput-root": { height: 42 },
              }}
              SelectProps={{ native: true }}
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

      {/* Desktop Table */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          position: "relative",
        }}
        className="hidden md:block"
      >
        {/* Loading Overlay for Desktop Table */}
        {isPending && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <CircularProgress
              sx={{
                color: "#1d2b48",
              }}
            />
          </Box>
        )}
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
                    <TableCell align="center">
                      {contract.owner?.name ?? "-"}
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(
                        Number(contract.valueAmount ?? 0),
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
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          height: 22,
                          borderColor:
                            contract.status === "ACTIVE"
                              ? "#10b981"
                              : contract.status === "DUE_SOON"
                              ? "#f59e0b"
                              : "#ef4444",
                          color:
                            contract.status === "ACTIVE"
                              ? "#10b981"
                              : contract.status === "DUE_SOON"
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {contract.nextRenewalDate
                        ? formatDate(
                            new Date(contract.nextRenewalDate),
                            org?.locale
                          )
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
                            color: "#374151",
                            minWidth: "100px",
                            boxShadow: "none !important",
                            "&:hover": { bgcolor: "#f9fafb" },
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
      <div className="md:hidden space-y-3" style={{ position: "relative" }}>
        {/* Loading Overlay for Mobile Cards */}
        {isPending && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              minHeight: "200px",
            }}
          >
            <CircularProgress
              sx={{
                color: "#1d2b48",
              }}
            />
          </Box>
        )}
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
                    sx={{
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      height: 22,
                      borderColor:
                        contract.status === "ACTIVE"
                          ? "#10b981"
                          : contract.status === "DUE_SOON"
                          ? "#f59e0b"
                          : "#ef4444",
                      color:
                        contract.status === "ACTIVE"
                          ? "#10b981"
                          : contract.status === "DUE_SOON"
                          ? "#f59e0b"
                          : "#ef4444",
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
                      {contract.owner?.name ?? "-"}
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
                        Number(contract.valueAmount ?? 0),
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
                      {formatDate(
                        new Date(contract.nextRenewalDate),
                        org?.locale
                      )}
                    </Typography>
                  </div>
                )}

                <Link href={`/contracts/${contract.id}`} className="block">
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                      borderColor: "#e5e7eb",
                      color: "#374151",
                      "&:hover": {
                        bgcolor: "#f9fafb",
                        borderColor: "#d1d5db",
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
      {filteredContracts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          sx={{
            width: "100%",
            bgcolor: "#ef4444",
            color: "white",
            fontSize: "1rem",
            "& .MuiAlert-icon": {
              color: "white",
            },
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default function ContractsClient(props: ContractsClientProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContractsClientInner {...props} />
    </Suspense>
  );
}
