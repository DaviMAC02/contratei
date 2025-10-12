"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { skipToken } from "@tanstack/react-query";
import { useTranslation } from "@/lib/use-translation";
import {
  formatCurrency,
  formatDate,
  getStatusTranslationKey,
} from "@/lib/utils";
import {
  FileText,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
  Avatar,
  Button,
  Skeleton,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export default function DashboardPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId, org }) => <DashboardContent orgId={orgId} org={org} />}
    </DashboardPageWrapper>
  );
}

// Styled components for professional stats cards
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

function StatsCardSkeleton() {
  return (
    <StatsCard>
      <MuiCardContent className="p-5">
        <Box className="flex items-start justify-between mb-3">
          <Skeleton className="w-11 h-11 rounded-md" />
          <Skeleton className="w-16 h-4" />
        </Box>
        <Skeleton className="w-16 h-9 mb-2" />
        <Skeleton className="w-24 h-4" />
      </MuiCardContent>
    </StatsCard>
  );
}

function DashboardContent({ orgId, org }: { orgId: string; org: any }) {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();

  // Get dashboard stats
  const statsQuery = trpc.contract.getDashboardStats.useQuery(
    orgId && orgId.trim() ? { orgId } : skipToken
  );

  // Get recent contracts
  const contractsQuery = trpc.contract.list.useQuery(
    orgId && orgId.trim() ? { orgId, limit: 5 } : skipToken
  );

  const stats = statsQuery.data;
  const contracts = contractsQuery.data?.contracts || [];

  const isLoadingStats = statsQuery.isLoading;
  const isLoadingContracts = contractsQuery.isLoading;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <Box className="mb-8">
        <Typography variant="h4" className="font-semibold text-gray-900 mb-1">
          {t("dashboard.welcome")},{" "}
          {session?.user?.name?.split(" ")[0] || "User"}
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Visão geral dos seus contratos e métricas
        </Typography>
      </Box>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoadingStats ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard>
              <MuiCardContent className="p-5">
                <Box className="flex items-start justify-between mb-3">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: "#e8f4f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText
                      className="h-5 w-5"
                      style={{ color: "#1d2b48" }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    className="text-gray-500 font-medium"
                  >
                    +{stats?.active || 0} ativos
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  className="font-semibold text-gray-900 mb-0.5"
                >
                  {stats?.total || 0}
                </Typography>
                <Typography variant="body2" className="text-gray-500 text-sm">
                  {t("dashboard.totalContracts")}
                </Typography>
              </MuiCardContent>
            </StatsCard>

            <StatsCard>
              <MuiCardContent className="p-5">
                <Box className="flex items-start justify-between mb-3">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: "#e8f4f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertCircle
                      className="h-5 w-5"
                      style={{ color: "#1d2b48" }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    className="text-gray-500 font-medium"
                  >
                    {stats?.expiring30 || 0} em 30d
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  className="font-semibold text-gray-900 mb-0.5"
                >
                  {stats?.dueSoon || 0}
                </Typography>
                <Typography variant="body2" className="text-gray-500 text-sm">
                  {t("dashboard.expiringSoon")}
                </Typography>
              </MuiCardContent>
            </StatsCard>

            <StatsCard>
              <MuiCardContent className="p-5">
                <Box className="flex items-start justify-between mb-3">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: "#e8f4f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertCircle
                      className="h-5 w-5"
                      style={{ color: "#1d2b48" }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    className="text-red-600 font-medium"
                  >
                    Atenção
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  className="font-semibold text-gray-900 mb-0.5"
                >
                  {stats?.expired || 0}
                </Typography>
                <Typography variant="body2" className="text-gray-500 text-sm">
                  {t("dashboard.expired")}
                </Typography>
              </MuiCardContent>
            </StatsCard>

            <StatsCard>
              <MuiCardContent className="p-5">
                <Box className="flex items-start justify-between mb-3">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: "#e8f4f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DollarSign
                      className="h-5 w-5"
                      style={{ color: "#1d2b48" }}
                    />
                  </Box>
                </Box>
                <Typography
                  variant="h5"
                  className="font-semibold text-gray-900 mb-0.5"
                >
                  {formatCurrency(
                    stats?.totalValue || 0,
                    org?.currency as any,
                    org?.locale
                  )}
                </Typography>
                <Typography variant="body2" className="text-gray-500 text-sm">
                  {t("dashboard.totalValue")}
                </Typography>
              </MuiCardContent>
            </StatsCard>
          </>
        )}
      </div>

      {/* Recent Contracts */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Typography
                variant="h6"
                className="font-semibold text-gray-900 mb-1"
              >
                {t("dashboard.recentContracts")}
              </Typography>
              <Typography variant="body2" className="text-gray-500 text-sm">
                Últimos contratos adicionados ou atualizados
              </Typography>
            </div>
            <Link
              href={`/contracts/new?orgId=${orgId}`}
              className="w-full sm:w-auto"
            >
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: "#1d2b48",
                  "&:hover": {
                    bgcolor: "#b3efe5",
                    color: "#1d2b48",
                    border: "1px solid rgba(0, 0, 0, 0.2)",
                  },
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("contracts.new")}
              </Button>
            </Link>
          </div>
        </Box>
        <MuiCardContent className="p-6">
          {isLoadingContracts ? (
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
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 1.5,
                  bgcolor: "#f9fafb",
                  border: "2px dashed #d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <FileText className="h-7 w-7 text-gray-400" />
              </Box>
              <Typography
                variant="h6"
                className="text-gray-900 font-semibold mb-2"
              >
                Nenhum contrato cadastrado
              </Typography>
              <Typography variant="body2" className="text-gray-500 mb-6">
                Comece criando seu primeiro contrato
              </Typography>
              <Link href={`/contracts/new?orgId=${orgId}`}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": {
                      bgcolor: "#b3efe5",
                      color: "#1d2b48",
                      border: "1px solid rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar contrato
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <Box
                  key={contract.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50/50 transition-all gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Typography
                        variant="subtitle1"
                        className="font-medium text-gray-900 truncate"
                      >
                        {contract.title}
                      </Typography>
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
                    <Typography
                      variant="body2"
                      className="text-gray-500 truncate mb-1 text-sm"
                    >
                      {contract.counterpartyName} • {contract.owner.name}
                    </Typography>
                    {contract.nextRenewalDate && (
                      <Typography
                        variant="caption"
                        className="text-gray-400 text-xs"
                      >
                        Próxima renovação:{" "}
                        {formatDate(contract.nextRenewalDate, org?.locale)}
                      </Typography>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:text-right">
                    <Typography
                      variant="subtitle1"
                      className="font-semibold text-gray-900"
                    >
                      {formatCurrency(
                        Number(contract.valueAmount),
                        contract.currency as any,
                        org?.locale
                      )}
                    </Typography>
                    <Link href={`/contracts/${contract.id}`}>
                      <Button
                        variant="text"
                        size="small"
                        sx={{
                          color: "#1d2b48",
                          "&:hover": {
                            bgcolor: "#b3efe5",
                            color: "#1d2b48",
                            border: "1px solid rgba(0, 0, 0, 0.2)",
                          },
                        }}
                      >
                        {t("contracts.view")}
                      </Button>
                    </Link>
                  </div>
                </Box>
              ))}
              <div className="text-center pt-4 border-t border-gray-200">
                <Link href={`/contracts?orgId=${orgId}`}>
                  <Button
                    variant="text"
                    sx={{
                      color: "#1d2b48",
                      "&:hover": {
                        bgcolor: "#b3efe5",
                        color: "#1d2b48",
                        border: "1px solid rgba(0, 0, 0, 0.2)",
                      },
                    }}
                  >
                    Ver todos os contratos
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </MuiCardContent>
      </MuiCard>
    </div>
  );
}
